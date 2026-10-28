// Static checks for each of the twelve factors. Facts that code can decide become
// rule evidence; judgments code can't make become candidates for the judge.
//
// Regexes are backtick strings, which still process standard escapes: write a word
// boundary as `\\b` (a bare `\b` is a backspace) and a backtick as `\x60`.

class Context {
    repo: Repo,
    /// Non-test code files
    code: string[],
    /// Platform name when the platform runs the process
    serverless: string?,
    deploy_configs: string[],
    has_server: bool,
    /// Backing-service clients or bindings found
    backing: string[],
    max_per_kind: int,
}

function comment_line(text: string) -> bool {
    baml.regex.new(`^\s*(//|#|\*|/\*|<!--|--)`).has_match(text)
}

function not_comments(hits: Hit[]) -> Hit[] {
    hits.filter((h: Hit) -> bool {
        !comment_line(h.text)
    })
}

function env_read_re() -> baml.regex.Regex {
    baml.regex.new(
        `process\.env|import\.meta\.env|os\.environ|os\.getenv|Deno\.env|env::var|System\.getenv|ENV\[|getenv\(|Bun\.env|\\benv\.[A-Z][A-Z0-9_]+\\b|Getenv\(`,
    )
}

function admin_path(path: string) -> bool {
    baml.regex.new(`^(scripts|bin|tools|migrations|seeds?)/`).has_match(path)
}

// ---------------------------------------------------------------------------
// Secrets: what counts as one, and how to mask it before it is shown or sent

class SecretPattern {
    pattern: string,
    label: string,
    /// Replacement that keeps the recognizable prefix (group 1) and drops the rest
    mask: string,
}

function secret_patterns() -> SecretPattern[] {
    [
        SecretPattern {
            pattern: `(-----BEGIN (RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----)`,
            label: "private key",
            mask: "$1",
        },
        SecretPattern {
            pattern: `\\b(AKIA)[0-9A-Z]{16}\\b`,
            label: "AWS access key",
            mask: "$1••••",
        },
        SecretPattern {
            pattern: `\\b(sk-)(ant-|proj-|live-|test-)?[A-Za-z0-9_-]{20,}`,
            label: "API secret key (sk-…)",
            mask: "$1••••",
        },
        SecretPattern {
            pattern: `\\b(gh[pousr]_)[A-Za-z0-9]{36,}\\b`,
            label: "GitHub token",
            mask: "$1••••",
        },
        SecretPattern {
            pattern: `\\b(xox[baprs]-)[A-Za-z0-9-]{10,}`,
            label: "Slack token",
            mask: "$1••••",
        },
        SecretPattern {
            pattern: `\\b(AIza)[0-9A-Za-z_-]{35}\\b`,
            label: "Google API key",
            mask: "$1••••",
        },
        SecretPattern {
            pattern: `\\b((sk|rk)_live_)[0-9A-Za-z]{20,}`,
            label: "Stripe live key",
            mask: "$1••••",
        },
    ]
}

function mask_url_password(s: string) -> string {
    s.replace_all(baml.regex.new(`(://[^\s'"\x60:@/]+:)[^\s'"\x60@/]+@`), "$1••••@")
}

/// Snippets go to a third-party judge: strip anything that looks like a secret first.
/// The shape stays ("a literal was here"), which is all the judge needs.
function redact(s: string) -> string {
    let out = mask_url_password(s).replace_all(
        baml.regex.new(
            `(?i)((password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)['"]?\s*[:=]\s*['"\x60])[^'"\x60\s]+`,
        ),
        "$1••••",
    );
    for (let sp in secret_patterns()) {
        out = out.replace_all(baml.regex.new(sp.pattern), sp.mask);
    }
    out
}

/// Keep the first hit for each distinct key, up to `max`, so one URL repeated across
/// 40 files becomes one question
function to_candidates(kind: Kind, hits: Hit[], max: int, key: (Hit) -> string) -> Candidate[] {
    let seen: map<string, bool> = {};
    let out: Candidate[] = [];
    for (let h in hits) {
        let k = key(h);
        if (!seen.has(k) && out.length() < max) {
            seen.set(k, true);
            out.push(
                Candidate {
                    kind: kind,
                    file: h.file,
                    line: h.line,
                    text: redact(h.text),
                    snippet: redact(h.snippet),
                },
            );
        }
    }
    out
}

function by_location(h: Hit) -> string {
    h.file + ":" + string.from(h.line)
}

function by_text(h: Hit) -> string {
    h.text
}

// ---------------------------------------------------------------------------
// Context shared by several factors

function dependency_names(repo: Repo) -> string[] {
    let names: string[] = [];
    for (let f in repo.files) {
        if (!is_test_path(f) && basename(f) == "package.json") {
            let pkg = read_package(repo, f);
            if (pkg != null) {
                names
                    = names.concat((pkg.dependencies ?? {}).keys()).concat(
                        (pkg.devDependencies ?? {}).keys(),
                    );
            }
        }
        if (
            !is_test_path(f)
                && baml.regex.new(`(^|/)(requirements[^/]*\.txt|pyproject\.toml|Pipfile)$`)
                    .has_match(f)
        ) {
            for (let m in baml.regex.new(`(?m)^\s*"?([A-Za-z0-9_.-]+)`).match_all(repo.read(f))) {
                names.push((m.groups.at(1)?.text ?? "").to_lower_case());
            }
        }
    }
    names
}

function build_context(repo: Repo, max_per_kind: int) -> Context {
    let root_files = repo.files.filter((f: string) -> bool {
        !f.includes("/") || baml.regex.new(`^(k8s|kubernetes|helm|\.do)/`).has_match(f)
    });
    let serverless: string? = null;
    if (
        root_files.some((f: string) -> bool {
            baml.regex.new(`^wrangler\.(toml|json|jsonc)$`).has_match(f)
        })
    ) {
        serverless = "Cloudflare Workers";
    } else if (root_files.includes("vercel.json")) {
        serverless = "Vercel";
    } else if (root_files.includes("netlify.toml")) {
        serverless = "Netlify";
    } else if (
        root_files.some((f: string) -> bool {
            baml.regex.new(`^serverless\.ya?ml$`).has_match(f)
        })
    ) {
        serverless = "Serverless Framework";
    }
    let deploy_re = baml.regex.new(
        `^(wrangler\.(toml|jsonc?)|vercel\.json|netlify\.toml|serverless\.ya?ml|fly\.toml|render\.ya?ml|railway\.(json|toml)|Procfile|app\.ya?ml|Dockerfile|docker-compose\.prod\.ya?ml|k8s/.+\.ya?ml|kubernetes/.+\.ya?ml|helm/.+|\.do/app\.ya?ml|apprunner\.ya?ml)$`,
    );
    let code = code_files(repo);
    let deps = dependency_names(repo);
    let known = [
        "pg",
        "postgres",
        "mysql",
        "mysql2",
        "mongodb",
        "mongoose",
        "redis",
        "ioredis",
        "@prisma/client",
        "prisma",
        "drizzle-orm",
        "knex",
        "typeorm",
        "sequelize",
        "kysely",
        "@neondatabase/serverless",
        "@planetscale/database",
        "@supabase/supabase-js",
        "amqplib",
        "kafkajs",
        "@aws-sdk/client-s3",
        "@aws-sdk/client-dynamodb",
        "bullmq",
        "psycopg",
        "psycopg2",
        "psycopg2-binary",
        "sqlalchemy",
        "pymongo",
        "redis-py",
        "asyncpg",
        "celery",
        "boto3",
    ];
    let backing = known.filter((d: string) -> bool {
        deps.includes(d)
    });
    let bindings = baml.regex.new(
        `"?(d1_databases|kv_namespaces|r2_buckets|queues|durable_objects|hyperdrive|services|vectorize|analytics_engine_datasets)"?\s*[:=]`,
    );
    for (let f in root_files) {
        if (f.starts_with("wrangler.")) {
            for (let m in bindings.match_all(repo.read(f))) {
                let label = "Workers binding: " + (m.groups.at(1)?.text ?? "");
                if (!backing.includes(label)) {
                    backing.push(label);
                }
            }
        }
    }
    let server_re = baml.regex.new(
        `\\b(express\(\)|fastify\(|new Koa\(|createServer\(|Bun\.serve\(|Deno\.serve\(|serve\(\{|app\.listen\(|Flask\(__name__\)|FastAPI\(|uvicorn\.run|gunicorn|ListenAndServe|HttpServer::new|axum::serve|Rails\.application|Sinatra)`,
    );
    Context {
        repo: repo,
        code: code,
        serverless: serverless,
        deploy_configs: root_files.filter((f: string) -> bool {
            deploy_re.has_match(f)
        }),
        has_server: serverless != null || grep(repo, server_re, code, 0).length() > 0,
        backing: backing,
        max_per_kind: max_per_kind,
    }
}

// ---------------------------------------------------------------------------
// I. Codebase: one codebase tracked in revision control, many deploys

function check_codebase(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    if (!repo.is_git) {
        return draft(
            1,
            "fail",
            "Not a git repository, so there is no single tracked codebase to deploy from.",
            [rule("fail", "No git repository at the target root.")],
            [],
        );
    }
    let evidence: Evidence[] = [];
    let remotes = output_lines(sh(repo.root, "git remote"));
    if (remotes.length() == 0) {
        evidence.push(rule("review", "No git remote: the code exists only on this machine."));
    } else {
        evidence.push(rule("info", "Remotes: " + remotes.join(", ")));
    }
    let apps = repo.files.filter((f: string) -> bool {
        f.includes("/")
            && baml.regex.new(`(^|/)(package\.json|pyproject\.toml|go\.mod|Cargo\.toml)$`)
                .has_match(f)
    });
    if (apps.length() > 0) {
        evidence.push(
            rule(
                "info",
                "Monorepo: "
                    + string.from(apps.length())
                    + " nested app manifests. Each app should deploy on its own.",
            ),
        );
    }
    if (remotes.length() > 0) {
        draft(1, "pass", "Tracked in git with a remote.", evidence, [])
    } else {
        draft(1, "review", "Tracked in git, but has no remote.", evidence, [])
    }
}

// ---------------------------------------------------------------------------
// II. Dependencies: explicitly declare and isolate dependencies

function lockfiles_for(manifest: string) -> string[] {
    let locks: map<string, string[]> = {
        "package.json": [
            "package-lock.json",
            "pnpm-lock.yaml",
            "yarn.lock",
            "bun.lock",
            "bun.lockb",
            "npm-shrinkwrap.json",
        ],
        "pyproject.toml": ["uv.lock", "poetry.lock", "pdm.lock", "requirements.txt"],
        "Pipfile": ["Pipfile.lock"],
        "go.mod": ["go.sum"],
        "Cargo.toml": ["Cargo.lock"],
        "Gemfile": ["Gemfile.lock"],
        "composer.json": ["composer.lock"],
        "mix.exs": ["mix.lock"],
    };
    locks.get(manifest) ?? []
}

function check_dependencies(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    let evidence: Evidence[] = [];
    let manifest_re = baml.regex.new(
        `(^|/)(package\.json|pyproject\.toml|Pipfile|go\.mod|Cargo\.toml|Gemfile|composer\.json|mix\.exs|requirements\.txt)$`,
    );
    let manifests = repo.files.filter((f: string) -> bool {
        manifest_re.has_match(f) && !is_test_path(f)
    });
    if (manifests.length() == 0) {
        return draft(
            2,
            "review",
            "No dependency manifest found.",
            [rule("review", "No package.json, pyproject.toml, go.mod or similar.")],
            [],
        );
    }
    for (let manifest in manifests) {
        let name = basename(manifest);
        let dir = dirname(manifest);
        if (name == "requirements.txt") {
            // A requirements file can be its own lock, if every line is pinned
            let pinned = baml.regex.new(`==|@\s*\S+#|\.whl$`);
            let unpinned = repo.read(manifest)
                .split("\n")
                .map((l: string) -> string {
                    l.trim()
                })
                .filter((l: string) -> bool {
                    l.length() > 0
                        && !l.starts_with("#")
                        && !l.starts_with("-")
                        && !pinned.has_match(l)
                });
            if (unpinned.length() > 0) {
                evidence.push(
                    rule_at(
                        "fail",
                        "Unpinned requirements: "
                            + unpinned.slice(0, imin(5, unpinned.length())).join(", "),
                        manifest,
                        null,
                    ),
                );
            }
        } else {
            let lock = lockfiles_for(name)
                .map((l: string) -> string {
                    dir + l
                })
                .find((l: string) -> bool {
                    repo.has(l)
                });
            // A workspace package can share the root lockfile
            let root_lock = if (dir == "") {
                null
            } else {
                lockfiles_for(name).find((l: string) -> bool {
                    repo.has(l)
                })
            };
            if (lock == null && root_lock == null) {
                evidence.push(
                    rule_at(
                        "fail",
                        "No lockfile next to " + manifest + ", so installs aren't reproducible.",
                        manifest,
                        null,
                    ),
                );
            } else if (lock != null && repo.is_git && !repo.is_tracked(lock)) {
                evidence.push(rule_at("fail", lock + " exists but isn't committed.", lock, null));
            } else {
                evidence.push(
                    rule_at(
                        "pass",
                        manifest + " is locked by " + (lock ?? root_lock ?? "?") + ".",
                        manifest,
                        null,
                    ),
                );
            }
            if (name == "package.json") {
                let pkg = read_package(repo, manifest);
                if (pkg != null) {
                    let all: map<string, string> = {};
                    for (let k in (pkg.dependencies ?? {}).keys()) {
                        all.set(k, (pkg.dependencies ?? {}).get(k) ?? "");
                    }
                    for (let k in (pkg.devDependencies ?? {}).keys()) {
                        all.set(k, (pkg.devDependencies ?? {}).get(k) ?? "");
                    }
                    let wild = ["*", "", "latest", "x", "next"];
                    let loose = all.keys().filter((k: string) -> bool {
                        wild.includes((all.get(k) ?? "").trim())
                    });
                    if (loose.length() > 0) {
                        evidence.push(
                            rule_at(
                                "fail",
                                "Wildcard versions: "
                                    + loose
                                        .map((k: string) -> string {
                                            k + "@\"" + (all.get(k) ?? "") + "\""
                                        })
                                        .join(", "),
                                manifest,
                                null,
                            ),
                        );
                    }
                }
            }
        }
    }
    if (
        evidence.some((e: Evidence) -> bool {
            e.verdict == "fail"
        })
    ) {
        draft(2, "fail", "Some dependencies aren't pinned or locked.", evidence, [])
    } else {
        draft(2, "pass", "Dependencies are declared and locked.", evidence, [])
    }
}

// ---------------------------------------------------------------------------
// III. Config: store config in the environment

function env_file(path: string) -> bool {
    baml.regex.new(`(^|/)(\.env(\.[\w.-]+)?|\.dev\.vars)$`).has_match(path)
}

function env_template(path: string) -> bool {
    baml.regex.new(`\.(example|sample|template|dist|defaults?)$`).has_match(path)
}

function check_config(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    let evidence: Evidence[] = [];
    let not_scanned = baml.regex.new(
        `(^|/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|[^/]*\.lock|[^/]*\.min\.js|[^/]*\.map)$`,
    );
    let scanned = repo.files.filter((f: string) -> bool {
        !not_scanned.has_match(f) && !is_test_path(f)
    });
    for (let sp in secret_patterns()) {
        let re = baml.regex.new(sp.pattern);
        let hits = grep(repo, re, scanned, 0);
        for (let h in hits.slice(0, imin(5, hits.length()))) {
            evidence.push(
                rule_at("fail", "Possible " + sp.label + " in source: " + redact(h.text), h.file, h.line),
            );
        }
    }
    if (repo.is_git) {
        for (let f in repo.tracked.keys()) {
            if (env_file(f) && !env_template(f)) {
                evidence.push(
                    rule_at(
                        "fail",
                        f
                            + " is committed. Env files hold per-deploy config and secrets; keep them out of git.",
                        f,
                        null,
                    ),
                );
            }
        }
    }
    let template = repo.files.find((f: string) -> bool {
        env_file(f) && env_template(f) && !is_test_path(f)
    });
    if (template != null) {
        evidence.push(
            rule_at("info", template + " documents the expected variables.", template, null),
        );
    }
    evidence.push(
        rule(
            "info",
            string.from(grep(repo, env_read_re(), ctx.code, 0).length())
                + " environment or binding reads in code.",
        ),
    );

    let literal = baml.regex.new(
        `(?i)['"\x60](https?://[^'"\x60\s]+|[^'"\x60\s]*(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+[^'"\x60\s]*)['"\x60]|(password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)['"]?\s*[:=]\s*['"\x60][^'"\x60\s]{4,}['"\x60]`,
    );
    let key = (h: Hit) -> string {
        literal.match_once(h.text)?.text ?? h.text
    };
    let candidates = to_candidates("config", not_comments(grep(repo, literal, ctx.code, 3)), ctx.max_per_kind, key);
    if (
        evidence.some((e: Evidence) -> bool {
            e.verdict == "fail"
        })
    ) {
        draft(3, "fail", "Secrets in the source or committed env files.", evidence, candidates)
    } else {
        draft(3, "pass", "No secrets or committed env files found.", evidence, candidates)
    }
}

// ---------------------------------------------------------------------------
// IV. Backing services: treat backing services as attached resources

function check_backing_services(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    let evidence: Evidence[] = [];
    let cred_url = baml.regex.new(`(?i)\\b[a-z][a-z0-9+.-]*://[^\s'"\x60:@/{}$]+:[^\s'"\x60@/{}$]+@[^\s'"\x60]+`);
    let creds = not_comments(grep(repo, cred_url, ctx.code, 0));
    for (let h in creds.slice(0, imin(5, creds.length()))) {
        evidence.push(
            rule_at(
                "fail",
                "Credentials inside a connection URL: " + mask_url_password(h.text),
                h.file,
                h.line,
            ),
        );
    }
    let service_url = baml.regex.new(
        `(?i)['"\x60](postgres(ql)?|mysql|mariadb|mongodb(\+srv)?|rediss?|amqps?|kafka|nats|sqlserver|mssql)://[^'"\x60\s]+['"\x60]|\\bhost\s*[:=]\s*['"\x60][a-z0-9.-]+\.[a-z]{2,}['"\x60]`,
    );
    let hits = not_comments(grep(repo, service_url, ctx.code, 3)).filter((h: Hit) -> bool {
        !cred_url.has_match(h.text)
    });
    let candidates = to_candidates("backing", hits, ctx.max_per_kind, by_text);
    if (ctx.backing.length() == 0 && candidates.length() == 0 && evidence.length() == 0) {
        return draft(4, "n/a", "No backing services (databases, caches, queues, storage) found.", [], []);
    }
    let declared = if (ctx.backing.length() > 0) {
        ctx.backing.join(", ")
    } else {
        "none declared as dependencies"
    };
    evidence.push(rule("info", "Backing services: " + declared));
    if (
        evidence.some((e: Evidence) -> bool {
            e.verdict == "fail"
        })
    ) {
        return draft(
            4,
            "fail",
            "A backing service's credentials are written into the code.",
            evidence,
            candidates,
        );
    }
    if (grep(repo, env_read_re(), ctx.code, 0).length() == 0) {
        evidence.push(
            rule(
                "review",
                "Backing services are used but the code never reads environment variables or bindings.",
            ),
        );
        return draft(
            4,
            "review",
            "Couldn't find where backing-service addresses come from.",
            evidence,
            candidates,
        );
    }
    draft(4, "pass", "Backing services are attached through config.", evidence, candidates)
}

// ---------------------------------------------------------------------------
// V. Build, release, run: strictly separate build and run stages

function check_build_release_run(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    let evidence: Evidence[] = [];
    let scripts = read_package(repo, "package.json")?.scripts ?? {};
    let build = scripts.get("build");
    if (build != null) {
        evidence.push(rule_at("info", "Build: npm run build → " + build, "package.json", null));
    }
    if (
        repo.files.includes("Makefile")
            && baml.regex.new(`(?m)^build:`).has_match(repo.read("Makefile"))
    ) {
        evidence.push(rule_at("info", "Build: make build", "Makefile", null));
    }
    let deploy_key = scripts.keys().find((k: string) -> bool {
        baml.regex.new(`deploy|release`).has_match(k)
    });
    if (deploy_key != null) {
        evidence.push(
            rule_at(
                "info",
                "Deploy script: npm run " + deploy_key + " → " + (scripts.get(deploy_key) ?? ""),
                "package.json",
                null,
            ),
        );
    }
    if (ctx.deploy_configs.length() > 0) {
        evidence.push(rule("info", "Deploy config: " + ctx.deploy_configs.join(", ")));
    }
    let ci_re = baml.regex.new(
        `^(\.github/workflows/.+\.ya?ml|\.gitlab-ci\.yml|\.circleci/config\.yml|\.buildkite/.+|azure-pipelines\.yml|bitbucket-pipelines\.yml)$`,
    );
    let ci = repo.files.filter((f: string) -> bool {
        ci_re.has_match(f)
    });
    if (ci.length() > 0) {
        evidence.push(rule("info", "CI: " + ci.join(", ")));
    }
    if (ctx.deploy_configs.length() == 0 && deploy_key == null) {
        evidence.push(
            rule(
                "fail",
                "No deploy config, Dockerfile or deploy script: the path to production isn't written down.",
            ),
        );
        return draft(5, "fail", "No defined way to build and release this service.", evidence, []);
    }
    if (ci.length() == 0) {
        evidence.push(
            rule(
                "review",
                "No CI found, so builds and releases run on someone's machine. Check they're reproducible from a clean checkout.",
            ),
        );
        return draft(5, "review", "Deploys are defined but run by hand.", evidence, []);
    }
    draft(5, "pass", "Build and release are defined and run in CI.", evidence, [])
}

// ---------------------------------------------------------------------------
// VI. Processes: execute the app as one or more stateless processes

/// A declaration alone ("const sessions = new Map()") doesn't say what it holds.
/// Add the lines that use the variable so the judge can see what it's for.
function with_usages(repo: Repo, h: Hit) -> Hit {
    let m = baml.regex
        .new(`(?i)^(?:export\s+)?(?:let|var|const)\s+(\w+)|^([a-z_][a-z0-9_]*)\s*(?::|=)`)
        .match_once(h.text);
    let name = m?.groups.at(1)?.text ?? m?.groups.at(2)?.text ?? "";
    if (name.length() < 3) {
        return h;
    }
    let uses_re = baml.regex.new(`\\b` + baml.regex.escape(name) + `\\b`);
    let lines = repo.read(h.file).split("\n");
    let uses: string[] = [];
    let i = 0;
    while (i < lines.length() && uses.length() < 6) {
        if (i + 1 != h.line && uses_re.has_match(lines[i])) {
            uses.push(string.from(i + 1) + ": " + lines[i].trim());
        }
        i = i + 1;
    }
    if (uses.length() == 0) {
        return h;
    }
    Hit {
        file: h.file,
        line: h.line,
        text: h.text,
        snippet: clip(h.snippet + "\n\n// where " + name + " is used:\n" + uses.join("\n"), 2000),
    }
}

function check_processes(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    let files = ctx.code.filter((f: string) -> bool {
        !admin_path(f)
    });
    let module_state = `^(export\s+)?(let|var|const)\s+\w+(\s*:\s*[^=]+)?\s*=\s*(new\s+(Map|Set|WeakMap|Array)\\b|\[\s*\]|\{\s*\}|\d+\s*;?\s*$)|^[a-z_][a-z0-9_]*\s*(:\s*[\w\[\], ]+)?\s*=\s*(\{\}|\[\]|dict\(\)|set\(\)|defaultdict\()`;
    let disk_write = `\\b(writeFile(Sync)?|appendFile(Sync)?|createWriteStream|mkdirSync)\s*\(|\\bopen\([^)]*['"][wa]b?\+?['"]|multer\(\s*\{\s*dest|express-session|MemoryStore|\\bUPLOAD_DIR\\b`;
    let hits = not_comments(grep(repo, baml.regex.new(module_state + "|" + disk_write), files, 3)).map((h: Hit) -> Hit {
        with_usages(repo, h)
    });
    let candidates = to_candidates("state", hits, ctx.max_per_kind, by_location);
    let summary = if (candidates.length() > 0) {
        "Process memory or local disk is used; the judge checks whether any of it must persist."
    } else {
        "No module-level state or local disk writes found."
    };
    draft(6, "pass", summary, [], candidates)
}

// ---------------------------------------------------------------------------
// VII. Port binding: export services via port binding

function check_port_binding(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    if (ctx.serverless != null) {
        return draft(
            7,
            "pass",
            "The platform (" + (ctx.serverless ?? "") + ") binds the port and routes requests.",
            [rule("info", "Runs on " + (ctx.serverless ?? "") + ".")],
            [],
        );
    }
    if (!ctx.has_server) {
        return draft(7, "n/a", "No HTTP server found.", [], []);
    }
    let infra = repo.files.filter((f: string) -> bool {
        baml.regex.new(`(^|/)(Procfile|Dockerfile|docker-compose[^/]*\.ya?ml|fly\.toml)$`)
            .has_match(f)
    });
    let port_env = baml.regex.new(
        `process\.env\.PORT|env\.PORT|environ(\.get)?\(?\[?\s*['"]PORT|getenv\(\s*['"]PORT|Getenv\("PORT"\)|\$PORT\\b|\$\{PORT`,
    );
    let from_env = grep(repo, port_env, ctx.code.concat(infra), 0);
    let literal = not_comments(
        grep(
            repo,
            baml.regex.new(
                `\.listen\(\s*\d{2,5}\s*[,)]|\\b(app\.run|uvicorn\.run)\([^)]*port\s*=\s*\d{2,5}|ListenAndServe\(\s*"[^"]*:\d{2,5}"`,
            ),
            ctx.code,
            0,
        ),
    );
    let first = from_env.at(0);
    if (first != null) {
        return draft(
            7,
            "pass",
            "The port comes from the PORT environment variable.",
            [rule_at("pass", "Reads PORT from the environment.", first.file, first.line)],
            [],
        );
    }
    if (literal.length() > 0) {
        return draft(
            7,
            "fail",
            "The server listens on a hard-coded port.",
            literal.slice(0, imin(3, literal.length())).map((h: Hit) -> Evidence {
                rule_at("fail", "Hard-coded port: " + h.text, h.file, h.line)
            }),
            [],
        );
    }
    draft(
        7,
        "review",
        "Has an HTTP server, but couldn't find which port it binds. Confirm with --run.",
        [rule("review", "No PORT read and no port literal found.")],
        [],
    )
}

// ---------------------------------------------------------------------------
// VIII. Concurrency: scale out via the process model

function check_concurrency(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    let evidence: Evidence[] = [];
    if (repo.files.includes("Procfile")) {
        let types = repo.read("Procfile")
            .split("\n")
            .map((l: string) -> string {
                (l.split(":").at(0) ?? "").trim()
            })
            .filter((t: string) -> bool {
                t.length() > 0
            });
        evidence.push(
            rule_at("info", "Procfile process types: " + types.join(", "), "Procfile", null),
        );
    }
    let crons = repo.files.find((f: string) -> bool {
        f.starts_with("wrangler.") && !f.includes("/") && repo.read(f).includes("crons")
    });
    if (crons != null) {
        evidence.push(
            rule_at("info", "Scheduled work runs through platform cron triggers.", crons, null),
        );
    }
    let job = baml.regex.new(
        `\\bsetInterval\s*\(|cron\.schedule\(|new CronJob\(|node-cron|schedule\.every\(|(Background|Blocking|AsyncIO)Scheduler\(|@Scheduled\\b|@periodic_task|beat_schedule|\.repeat\s*\(|every\(\s*['"]\d`,
    );
    let candidates = to_candidates(
        "job",
        not_comments(
            grep(
                repo,
                job,
                ctx.code.filter((f: string) -> bool {
                    !admin_path(f)
                }),
                3,
            ),
        ),
        ctx.max_per_kind,
        by_location,
    );
    let summary = if (candidates.length() > 0) {
        "In-process timers or schedulers found; the judge checks whether a second instance would repeat them."
    } else {
        "No in-process schedulers that would duplicate work across instances."
    };
    draft(8, "pass", summary, evidence, candidates)
}

// ---------------------------------------------------------------------------
// IX. Disposability: fast startup and graceful shutdown

function check_disposability(ctx: Context) -> FactorDraft {
    if (ctx.serverless != null) {
        return draft(
            9,
            "pass",
            "The platform (" + (ctx.serverless ?? "") + ") starts and stops instances.",
            [rule("info", "Runs on " + (ctx.serverless ?? "") + ".")],
            [],
        );
    }
    if (!ctx.has_server) {
        return draft(9, "n/a", "No long-running server found.", [], []);
    }
    let shutdown = baml.regex.new(
        `(?i)process\.on\(\s*['"]SIG(TERM|INT)|signal\.signal\(\s*signal\.SIGTERM|signal\.Notify\(|tokio::signal|addShutdownHook|@PreDestroy|on_event\(\s*['"]shutdown|\\blifespan\\b|\.close\(\s*\(\)\s*=>|graceful`,
    );
    let first = not_comments(grep(ctx.repo, shutdown, ctx.code, 0)).at(0);
    if (first != null) {
        return draft(
            9,
            "pass",
            "Handles shutdown signals.",
            [rule_at("pass", "Shutdown handling: " + first.text, first.file, first.line)],
            [],
        );
    }
    draft(
        9,
        "review",
        "No SIGTERM handling found. Some frameworks handle it for you; confirm with --run.",
        [rule("review", "A deploy or scale-down may cut off requests in flight.")],
        [],
    )
}

// ---------------------------------------------------------------------------
// X. Dev/prod parity: keep development, staging, and production as similar as possible

function check_dev_prod_parity(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    if (
        ctx.backing.some((b: string) -> bool {
            b.starts_with("Workers binding")
        })
    ) {
        return draft(
            10,
            "pass",
            "wrangler dev runs the same Workers runtime and bindings locally.",
            [rule("info", "Cloudflare bindings are emulated locally by wrangler dev.")],
            [],
        );
    }
    if (ctx.backing.length() == 0) {
        return draft(10, "n/a", "No backing services to compare between environments.", [], []);
    }
    // Gather what each environment uses and let the judge compare the two lists
    let local: string[] = [];
    let production: string[] = [];
    let image_re = baml.regex.new(`image:\s*([^\s#]+)`);
    for (let f in repo.files) {
        if (!is_test_path(f) && baml.regex.new(`(^|/)docker-compose[^/]*\.ya?ml$`).has_match(f)) {
            let images = image_re.match_all(repo.read(f)).map((m: baml.regex.Match) -> string {
                m.groups.at(1)?.text ?? ""
            });
            let line = f + ": images " + images.join(", ");
            if (f.includes("prod")) {
                production.push(line);
            } else {
                local.push(line);
            }
        }
        if (!is_test_path(f) && env_file(f) && env_template(f)) {
            let url_re = baml.regex.new(`(?m)^\s*([A-Z_]*(URL|HOST|DSN)[A-Z_]*)\s*=\s*(\S+)`);
            let urls = url_re.match_all(repo.read(f)).map((m: baml.regex.Match) -> string {
                (m.groups.at(1)?.text ?? "") + "=" + mask_url_password(m.groups.at(3)?.text ?? "")
            });
            if (urls.length() > 0) {
                let line = f + ": " + urls.join("; ");
                if (f.includes("prod")) {
                    production.push(line);
                } else {
                    local.push(line);
                }
            }
        }
    }
    let manifests = repo.files.filter((f: string) -> bool {
        baml.regex.new(`package\.json|requirements|pyproject`).has_match(f) && !is_test_path(f)
    });
    let sqlite = grep(
        repo,
        baml.regex.new(`better-sqlite3|sqlite3|sqlite://|:memory:|aiosqlite`),
        ctx.code.concat(manifests),
        0,
    );
    if (sqlite.length() > 0) {
        local.push(
            "SQLite used in "
                + sqlite
                    .map((h: Hit) -> string {
                        h.file
                    })
                    .slice(0, imin(3, sqlite.length()))
                    .join(", "),
        );
    }
    let prisma = repo.files.find((f: string) -> bool {
        f.ends_with("schema.prisma")
    });
    if (prisma != null) {
        production.push(
            prisma
                + ": "
                + baml.regex.new(`provider\s*=\s*"\w+"`)
                    .match_all(repo.read(prisma))
                    .map((m: baml.regex.Match) -> string {
                        m.text
                    })
                    .join(", "),
        );
    }
    for (let f in ctx.deploy_configs) {
        production.push(f + ": " + clip(repo.read(f), 600).replace_all(baml.regex.new(`\s+`), " "));
    }
    production.push("Backing services in dependencies: " + ctx.backing.join(", "));
    if (local.length() == 0) {
        return draft(
            10,
            "review",
            "Couldn't find how the backing services run locally (no docker-compose or env template).",
            [rule("review", "No local setup for backing services found.")],
            [],
        );
    }
    let snippet = clip(
        redact("local:\n- " + local.join("\n- ") + "\nproduction:\n- " + production.join("\n- ")),
        3000,
    );
    draft(
        10,
        "pass",
        "Local and production setups found; the judge compares them.",
        [],
        [
            Candidate {
                kind: "parity",
                file: "(repo)",
                line: 0,
                text: "local vs production setup",
                snippet: snippet,
            },
        ],
    )
}

// ---------------------------------------------------------------------------
// XI. Logs: treat logs as event streams

function check_logs(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    let deps = dependency_names(repo);
    let structured = [
        "pino",
        "winston",
        "bunyan",
        "structlog",
        "loguru",
        "go.uber.org/zap",
        "zerolog",
        "tracing-subscriber",
        "@logtape/logtape",
    ]
        .filter((d: string) -> bool {
            deps.includes(d)
        });
    let lib = if (structured.length() > 0) {
        "Logging library: " + structured.join(", ")
    } else {
        "No logging library; logs use console or print."
    };
    let file_log = baml.regex.new(
        `(?i)['"\x60][^'"\x60]*\.log['"\x60]|createWriteStream\([^)]*log|(Timed)?RotatingFileHandler|\\bFileHandler\(|transports\.File|pino\.destination\(\s*['"]|basicConfig\([^)]*filename|log4js|logrotate`,
    );
    let candidates = to_candidates(
        "logs",
        not_comments(
            grep(
                repo,
                file_log,
                ctx.code.filter((f: string) -> bool {
                    !admin_path(f)
                }),
                3,
            ),
        ),
        ctx.max_per_kind,
        by_location,
    );
    let summary = if (candidates.length() > 0) {
        "Possible log files found; the judge checks where these logs go."
    } else {
        "No log files written by the app; logs go to stdout/stderr."
    };
    draft(11, "pass", summary, [rule("info", lib)], candidates)
}

// ---------------------------------------------------------------------------
// XII. Admin processes: run admin/management tasks as one-off processes

function check_admin_processes(ctx: Context) -> FactorDraft {
    let repo = ctx.repo;
    let evidence: Evidence[] = [];
    let dir_re = baml.regex.new(
        `(^|/)(migrations|migrate|alembic|drizzle|db/migrate|prisma/migrations|supabase/migrations)/`,
    );
    let dirs: string[] = [];
    for (let f in repo.files) {
        if (dir_re.has_match(f) && !is_test_path(f)) {
            // "db/migrations/0001_init.sql" → "db/migrations/"
            let d = f.replace(baml.regex.new(`^(.*?(migrations|migrate|alembic|drizzle)/).*$`), "$1");
            if (!dirs.includes(d)) {
                dirs.push(d);
            }
        }
    }
    let scripts = read_package(repo, "package.json")?.scripts ?? {};
    let cmd_re = baml.regex.new(
        `migrat|db:push|drizzle-kit|prisma (migrate|db)|knex migrate|alembic|d1 migrations|sequelize db:migrate|typeorm migration`,
    );
    let cmd = scripts.keys().find((k: string) -> bool {
        cmd_re.has_match(k + " " + (scripts.get(k) ?? ""))
    });
    let make = repo.files.includes("Makefile")
        && baml.regex.new(`(?m)^(migrate|db-migrate)[\w-]*:`).has_match(repo.read("Makefile"));
    let django = repo.files.some((f: string) -> bool {
        f.ends_with("manage.py")
    });
    let release = repo.files.includes("Procfile")
        && baml.regex.new(`(?m)^release:`).has_match(repo.read("Procfile"));
    if (dirs.length() > 0) {
        evidence.push(rule("info", "Migrations: " + dirs.join(", ")));
    }
    if (cmd != null) {
        evidence.push(
            rule_at(
                "pass",
                "Migration command: npm run " + cmd + " → " + (scripts.get(cmd) ?? ""),
                "package.json",
                null,
            ),
        );
    }
    if (make) {
        evidence.push(rule_at("pass", "Migration command: make migrate", "Makefile", null));
    }
    if (django) {
        evidence.push(rule("pass", "Migration command: python manage.py migrate"));
    }
    if (release) {
        evidence.push(
            rule_at("pass", "Procfile release phase runs on every deploy.", "Procfile", null),
        );
    }
    let has_cmd = cmd != null || make || django || release;
    let one_off = repo.files
        .filter((f: string) -> bool {
            f.starts_with("scripts/")
        })
        .length();
    if (one_off > 0) {
        evidence.push(rule("info", string.from(one_off) + " files in scripts/ for one-off tasks."));
    }
    if (ctx.backing.length() == 0 && dirs.length() == 0) {
        return draft(12, "n/a", "No database or migrations found.", evidence, []);
    }
    if (dirs.length() > 0 && !has_cmd) {
        evidence.push(
            rule(
                "review",
                "Migrations exist but no command runs them, so someone applies them by hand. Add one, for example an npm script.",
            ),
        );
        return draft(12, "review", "Migrations are in the repo but applied by hand.", evidence, []);
    }
    if (dirs.length() == 0 && !has_cmd) {
        evidence.push(
            rule(
                "review",
                "Uses a database but has no migrations in the repo. Schema changes may live only in someone's shell history.",
            ),
        );
        return draft(12, "review", "No migrations found for the database.", evidence, []);
    }
    draft(12, "pass", "Admin tasks are in the repo and run with one command.", evidence, [])
}

function static_checks(ctx: Context) -> FactorDraft[] {
    [
        check_codebase(ctx),
        check_dependencies(ctx),
        check_config(ctx),
        check_backing_services(ctx),
        check_build_release_run(ctx),
        check_processes(ctx),
        check_port_binding(ctx),
        check_concurrency(ctx),
        check_disposability(ctx),
        check_dev_prod_parity(ctx),
        check_logs(ctx),
        check_admin_processes(ctx),
    ]
}

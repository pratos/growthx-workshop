// Tests. Run with `baml test`. They use test/fixtures and never call Jev or an LLM:
// judgments are synthetic, and the LLM reply is parsed from canned text.

function fixture(name: string) -> string {
    "test/fixtures/" + name
}

/// Copy a fixture to a temp dir, optionally as a git repo with a remote
function copy_fixture(name: string, git: bool) -> string {
    let dir = output_lines(sh(".", "mktemp -d")).at(0) ?? "";
    let git_cmd = if (git) {
        " && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm init && git remote add origin https://example.com/repo.git"
    } else {
        ""
    };
    let _ = sh(
        ".",
        "cp -R "
            + shell_quote(fixture(name))
            + "/. "
            + shell_quote(dir)
            + " && cd "
            + shell_quote(dir)
            + git_cmd,
    );
    dir
}

function no_judge() -> JudgeOptions {
    JudgeOptions {
        mode: "none",
        api_key: "",
        model: "",
        thresholds: Thresholds { fail_at: 0.8, pass_at: 0.2 },
        concurrency: 4,
    }
}

function statuses(root: string) -> string {
    judge_all(static_checks(build_context(open_repo(root), 20)), no_judge())
        .map((r: FactorResult) -> string {
            string.from(r.id) + ":" + r.status
        })
        .join(" ")
}

/// Judge every candidate with a fixed probability per kind
function stub_judged(drafts: FactorDraft[]) -> Judged {
    let ps: map<string, float> = { "state": 0.95, "job": 0.5, "logs": 0.05, "config": 0.1, "backing": 0.1, "parity": 0.1 };
    let js = drafts
        .flat_map((d: FactorDraft) -> Candidate[] {
            d.candidates
        })
        .map((c: Candidate) -> Judgment | null {
            Judgment { ok: true, p: ps.get(c.kind) ?? 0.0, note: "stub", status_code: 200 }
        });
    Judged { judgments: js, stop: null }
}

function status_of(results: FactorResult[], id: int) -> string {
    results
        .find((r: FactorResult) -> bool {
            r.id == id
        })
        ?.status
        ?? "missing"
}

test "bad service: rules fail what code can decide, the rest waits for review" {
    assert.equal(
        statuses(fixture("bad-service")),
        "1:fail 2:fail 3:fail 4:fail 5:fail 6:review 7:fail 8:review 9:review 10:review 11:review 12:review",
    )
}

test "good service: nothing fails; parity needs a judge" {
    assert.equal(
        statuses(copy_fixture("good-service", true)),
        "1:pass 2:pass 3:pass 4:pass 5:pass 6:pass 7:pass 8:pass 9:pass 10:review 11:pass 12:pass",
    )
}

test "judge probabilities map to fail, review and pass at the thresholds" {
    let drafts = static_checks(build_context(open_repo(fixture("bad-service")), 20));
    let results = combine(drafts, stub_judged(drafts), no_judge());
    // state 0.95 fails, job 0.5 is unsure, logs 0.05 clears, and config stays failed
    // because the leaked key is a rule failure the judge can't clear
    assert.equal(
        status_of(results, 6)
            + " "
            + status_of(results, 8)
            + " "
            + status_of(results, 11)
            + " "
            + status_of(results, 3),
        "fail review pass fail",
    )
}

test "a judge outage leaves items for review instead of passing them" {
    let drafts = static_checks(build_context(open_repo(fixture("bad-service")), 20));
    let none = drafts
        .flat_map((d: FactorDraft) -> Candidate[] {
            d.candidates
        })
        .map((c: Candidate) -> Judgment | null {
            null
        });
    let results = combine(drafts, Judged { judgments: none, stop: "HTTP 401" }, no_judge());
    assert.equal(status_of(results, 8) + " " + status_of(results, 11), "review review")
}

test "secrets never reach the judge" {
    let drafts = static_checks(build_context(open_repo(fixture("bad-service")), 20));
    let leaked = drafts
        .flat_map((d: FactorDraft) -> Candidate[] {
            d.candidates
        })
        .some((c: Candidate) -> bool {
            c.snippet.includes("hunter2") || c.snippet.includes("FAKEFAKEFAKE")
        });
    assert.equal(leaked, false)
}

test "redact masks secrets but keeps the shape of the line" {
    assert.equal(
        redact("url = \"postgres://app:s3cret@db:5432/x\"")
            + " | "
            + redact("api_key: \"abcd1234efgh\"")
            + " | "
            + redact("k = \"sk_live_FAKEFAKEFAKEFAKEFAKE1234\""),
        "url = \"postgres://app:••••@db:5432/x\" | api_key: \"••••\" | k = \"sk_live_••••\"",
    )
}

test "llm judge reply parses even with chatter around it" {
    let v = baml.sap.parse<LlmVerdict>(
        "Sure, here it is:\n{\"probability\": 0.9, \"reason\": \"server-side job\"}",
    );
    assert.equal(v.probability, 0.9)
}

test "runtime: the good service binds PORT, runs twice and shuts down cleanly" {
    let dir = copy_fixture("good-service", false);
    let ev = run_checks(
        dir,
        RunConfig {
            start: "node server.js",
            health: null,
            env: null,
            migrate: "node scripts/migrate.js",
            startupTimeoutMs: null,
            shutdownTimeoutMs: null,
        },
    );
    let verdicts = ["7", "8", "9", "12"]
        .map((id: string) -> string {
            id
                + ":"
                + (ev.get(id) ?? [])
                    .map((e: Evidence) -> string {
                        e.verdict
                    })
                    .join(",")
        })
        .join(" ");
    assert.equal(verdicts, "7:pass 8:pass 9:pass,pass 12:pass")
}

test "runtime: a server that ignores PORT fails port binding" {
    let dir = copy_fixture("good-service", false);
    baml.fs.write(
        dir + "/server.js",
        "require(\"node:http\").createServer((q, s) => s.end(\"ok\")).listen(0);\n",
    );
    let ev = run_checks(
        dir,
        RunConfig {
            start: "node server.js",
            health: null,
            env: null,
            migrate: null,
            startupTimeoutMs: 3000,
            shutdownTimeoutMs: null,
        },
    );
    assert.equal((ev.get("7") ?? []).at(0)?.verdict ?? "none", "fail")
}

// Reads a target repository: which files exist, their text, and line searches.

class Hit {
    file: string,
    /// 1-based
    line: int,
    /// The matching line, trimmed
    text: string,
    /// A few lines around the match, for the judge
    snippet: string,
}

class Repo {
    root: string,
    is_git: bool,
    /// Repo-relative paths: tracked plus untracked-but-not-ignored when the repo uses git
    files: string[],
    /// Committed files; empty and unused when the repo doesn't use git
    tracked: map<string, bool>,
    cache: map<string, string>,

    function read(self, path: string) -> string {
        let cached = self.cache.get(path);
        if (cached != null) {
            return cached;
        }
        let full = self.root + "/" + path;
        let size = baml.fs.size(full) catch (e) {
            let e => -1
        };
        // Skip big files and anything that isn't UTF-8 text
        let text = if (size < 0 || size > 524288) {
            ""
        } else {
            baml.fs.read(full) catch (e) {
                let e => ""
            }
        };
        self.cache.set(path, text);
        text
    }

    function has(self, path: string) -> bool {
        self.files.includes(path)
            || (
                baml.fs.exists(self.root + "/" + path) catch (e) {
                    let e => false
                }
            )
    }

    function is_tracked(self, path: string) -> bool {
        self.tracked.has(path)
    }
}

function sh(cwd: string, cmd: string) -> baml.sys.ShellOutput {
    baml.sys.exec(
        "sh",
        ["-c", cmd],
        baml.sys.ProcessOptions {
            cwd: cwd,
            env: null,
            timeout_ms: 30000,
            stdin: null,
            stderr: baml.sys.StderrMode.Discard,
        },
    )
}

function output_lines(out: baml.sys.ShellOutput) -> string[] {
    let text = string.from_utf8(out.stdout) catch (e) {
        let e => ""
    };
    text.split("\n").filter((l: string) -> bool {
        l.trim().length() > 0
    })
}

function skipped_path(path: string) -> bool {
    let skip = [
        "node_modules",
        ".git",
        "dist",
        "build",
        "out",
        ".next",
        ".wrangler",
        ".venv",
        "venv",
        "__pycache__",
        "vendor",
        "target",
        "coverage",
        ".turbo",
        ".cache",
    ];
    path.split("/").some((part: string) -> bool {
        skip.includes(part)
    })
}

function open_repo(root: string) -> Repo {
    let real_root = output_lines(sh(root, "pwd -P")).at(0) ?? root;
    let top = sh(root, "git rev-parse --show-toplevel");
    let top_path = output_lines(top).at(0) ?? "";
    // Only treat the target as a git repo when it is the repo root, so a folder
    // inside someone else's repo is scanned on its own terms
    let real_top = if (top.ok()) {
        output_lines(sh(top_path, "pwd -P")).at(0) ?? ""
    } else {
        ""
    };
    let tracked: map<string, bool> = {};
    if (top.ok() && real_top == real_root) {
        let files = output_lines(sh(root, "git ls-files --cached --others --exclude-standard"));
        for (let f in output_lines(sh(root, "git ls-files --cached"))) {
            tracked.set(f, true);
        }
        return Repo {
            root: root,
            is_git: true,
            files: files.filter((f: string) -> bool {
                !skipped_path(f)
            }),
            tracked: tracked,
            cache: {},
        };
    }
    let found = output_lines(
        sh(
            root,
            "find . \\( -name node_modules -o -name .git -o -name dist -o -name build -o -name .wrangler -o -name .venv -o -name venv -o -name __pycache__ -o -name vendor -o -name target -o -name coverage -o -name .next \\) -prune -o -type f -print",
        ),
    );
    let files = found.map((f: string) -> string {
        if (f.starts_with("./")) {
            f.slice(2, f.length())
        } else {
            f
        }
    });
    Repo {
        root: root,
        is_git: false,
        files: files.filter((f: string) -> bool {
            !skipped_path(f)
        }),
        tracked: tracked,
        cache: {},
    }
}

function is_test_path(path: string) -> bool {
    let re = baml.regex.new(
        `(^|/)(tests?|__tests__|spec|specs|fixtures?|__mocks__|e2e|testdata)(/|$)|\.(test|spec)\.[a-z]+$|_test\.(go|py)$|(^|/)test_[^/]+\.py$`,
    );
    re.has_match(path)
}

function is_code(path: string) -> bool {
    let re = baml.regex.new(
        `\.(js|jsx|mjs|cjs|ts|tsx|mts|cts|py|go|rb|rs|java|kt|php|cs|ex|exs|scala|swift)$`,
    );
    re.has_match(path) && !path.ends_with(".d.ts") && !path.ends_with(".min.js")
}

function code_files(repo: Repo) -> string[] {
    repo.files.filter((f: string) -> bool {
        is_code(f) && !is_test_path(f)
    })
}

/// Search files line by line, keeping `context` lines around each match.
function grep(repo: Repo, re: baml.regex.Regex, files: string[], context: int) -> Hit[] {
    let hits: Hit[] = [];
    for (let file in files) {
        let lines = repo.read(file).split("\n");
        let i = 0;
        while (i < lines.length()) {
            let line = lines[i];
            if (re.has_match(line)) {
                let from = imax(0, i - context);
                let to = imin(lines.length(), i + context + 1);
                hits.push(
                    Hit {
                        file: file,
                        line: i + 1,
                        text: clip(line.trim(), 200),
                        snippet: clip(lines.slice(from, to).join("\n"), 1500),
                    },
                );
            }
            i = i + 1;
        }
    }
    hits
}

function basename(path: string) -> string {
    path.split("/").at(path.split("/").length() - 1) ?? path
}

function dirname(path: string) -> string {
    let parts = path.split("/");
    if (parts.length() <= 1) {
        ""
    } else {
        parts.slice(0, parts.length() - 1).join("/") + "/"
    }
}

class PackageJson {
    dependencies: map<string, string>?,
    devDependencies: map<string, string>?,
    scripts: map<string, string>?,
}

function read_package(repo: Repo, path: string) -> PackageJson? {
    let text = repo.read(path);
    if (text.length() == 0) {
        return null;
    }
    baml.json.from_string<PackageJson>(text) catch (e) {
        let e => null
    }
}

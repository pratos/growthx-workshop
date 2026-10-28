// Markdown and JSON output.

class RunInfo {
    repo: string,
    files: int,
    /// "jev", "llm" or why judging is off
    judge: string,
    runtime: string,
}

class Report {
    info: RunInfo,
    results: FactorResult[],
}

function roman(id: int) -> string {
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"].at(id - 1) ?? "?"
}

function label(s: Status) -> string {
    if (s == "pass") {
        "PASS"
    } else if (s == "fail") {
        "FAIL"
    } else if (s == "review") {
        "REVIEW"
    } else {
        "n/a"
    }
}

function location(e: Evidence) -> string {
    let file = e.file;
    if (file == null) {
        return "";
    }
    let line = e.line;
    "`"
        + file
        + (
            if (line == null) {
                ""
            } else {
                ":" + string.from(line)
            }
        )
        + "` "
}

function to_markdown(info: RunInfo, results: FactorResult[], verbose: bool) -> string {
    let count = (s: Status) -> int {
        results
            .filter((r: FactorResult) -> bool {
                r.status == s
            })
            .length()
    };
    let lines: string[] = [
        "# 12-factor check: " + info.repo,
        "",
        string.from(info.files)
            + " files scanned · judge "
            + info.judge
            + " · runtime checks "
            + info.runtime,
        "",
        "**"
            + string.from(count("fail"))
            + " fail · "
            + string.from(count("review"))
            + " review · "
            + string.from(count("pass"))
            + " pass · "
            + string.from(count("n/a"))
            + " n/a**",
        "",
        "| # | Factor | Result | Summary |",
        "| --- | --- | --- | --- |",
    ];
    for (let r in results) {
        lines.push(
            "| "
                + roman(r.id)
                + " | "
                + r.name
                + " | "
                + label(r.status)
                + " | "
                + r.summary.replace_all("|", "\\|")
                + " |",
        );
    }
    lines.push("");
    for (let r in results) {
        let shown = r.evidence.filter((e: Evidence) -> bool {
            verbose || e.verdict != "pass" || e.source == "run"
        });
        if (shown.length() > 0) {
            lines.push("## " + roman(r.id) + ". " + r.name + ": " + label(r.status));
            lines.push("");
            let problems = shown.filter((e: Evidence) -> bool {
                e.verdict == "fail" || e.verdict == "review"
            });
            let rest = shown.filter((e: Evidence) -> bool {
                e.verdict != "fail" && e.verdict != "review"
            });
            let limit = if (verbose) {
                problems.length()
            } else {
                imin(10, problems.length())
            };
            for (let e in problems.slice(0, limit).concat(rest)) {
                lines.push("- [" + e.verdict + "] " + location(e) + e.text);
            }
            if (problems.length() > limit) {
                lines.push(
                    "- …and " + string.from(problems.length() - limit) + " more (use --verbose)",
                );
            }
            lines.push("");
        }
    }
    lines.join("\n")
}

function to_json(info: RunInfo, results: FactorResult[]) -> string {
    baml.json.serialize<Report>(Report { info: info, results: results })
}

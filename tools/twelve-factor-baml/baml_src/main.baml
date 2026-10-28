// twelve-factor <repo> — check a service against the original Twelve-Factor App.
//
//   baml run main -- <repo> [options]       from this project
//   ./twelve-factor <repo> [options]        after `baml pack main --output twelve-factor`

function usage() -> string {
    "Usage: twelve-factor <repo> [options]

Checks a service against the twelve factors (12factor.net). Rules decide what
code can decide; a judge (Jev or an LLM) decides the rest.

Options:
  --judge <jev|llm|none> Who judges fuzzy findings (default: jev when
                         TYPESAFE_API_KEY is set, otherwise none)
  --no-jev               Same as --judge none
  --run                  Also start the service using <repo>/twelve-factor.json
  --json                 Print JSON instead of Markdown
  --out <file>           Write the report to a file
  --max-per-factor <n>   Most items per factor sent to the judge (default 20)
  --model <name>         Jev model (default jev-latest)
  --fail-at <p>          Probability that fails an item (default 0.8)
  --pass-at <p>          Probability that clears an item (default 0.2)
  --verbose              Show every finding
  -h, --help             Show this help

Exit code: 1 when any factor fails (so it can gate CI), 2 for usage errors."
}

class Args {
    repo: string?,
    judge: string?,
    run: bool,
    json: bool,
    verbose: bool,
    out: string?,
    max_per_factor: int,
    model: string,
    fail_at: float,
    pass_at: float,
    help: bool,
    error: string?,
}

function parse_args(argv: string[]) -> Args {
    let a = Args {
        repo: null,
        judge: null,
        run: false,
        json: false,
        verbose: false,
        out: null,
        max_per_factor: 20,
        model: "jev-latest",
        fail_at: 0.8,
        pass_at: 0.2,
        help: false,
        error: null,
    };
    let i = 0;
    while (i < argv.length()) {
        let arg = argv[i];
        let value = argv.at(i + 1) ?? "";
        let takes = ["--judge", "--out", "--max-per-factor", "--model", "--fail-at", "--pass-at"];
        if (takes.includes(arg) && i + 1 >= argv.length()) {
            a.error = arg + " needs a value";
        }
        if (arg == "-h" || arg == "--help") {
            a.help = true;
        } else if (arg == "--no-jev") {
            a.judge = "none";
        } else if (arg == "--run") {
            a.run = true;
        } else if (arg == "--json") {
            a.json = true;
        } else if (arg == "--verbose") {
            a.verbose = true;
        } else if (arg == "--judge") {
            if (!["jev", "llm", "none"].includes(value)) {
                a.error = "--judge must be jev, llm or none";
            }
            a.judge = value;
            i = i + 1;
        } else if (arg == "--out") {
            a.out = value;
            i = i + 1;
        } else if (arg == "--model") {
            a.model = value;
            i = i + 1;
        } else if (arg == "--max-per-factor") {
            a.max_per_factor
                = baml.Int.parse(value) catch (e) {
                    let e => -1
                };
            if (a.max_per_factor < 1) {
                a.error = "--max-per-factor must be a positive number";
            }
            i = i + 1;
        } else if (arg == "--fail-at" || arg == "--pass-at") {
            let p = baml.Float.parse(value) catch (e) {
                let e => -1.0
            };
            if (p < 0.0 || p > 1.0) {
                a.error = arg + " must be between 0 and 1";
            }
            if (arg == "--fail-at") {
                a.fail_at = p;
            } else {
                a.pass_at = p;
            }
            i = i + 1;
        } else if (arg.starts_with("-")) {
            a.error = "Unknown option: " + arg;
        } else if (a.repo == null) {
            a.repo = arg;
        } else {
            a.error = "Only one repo path, got a second: " + arg;
        }
        i = i + 1;
    }
    a
}

function merge_runtime(results: FactorResult[], run: map<string, Evidence[]>) -> FactorResult[] {
    results.map((r: FactorResult) -> FactorResult {
        let ev = run.get(string.from(r.id)) ?? [];
        if (ev.length() == 0) {
            return r;
        }
        let run_status: Status = "pass";
        for (let e in ev) {
            if (e.verdict == "fail") {
                run_status = "fail";
            } else if (e.verdict == "review") {
                run_status = worst(run_status, "review");
            }
        }
        // Watching the service bind, scale and stop beats reading its source for VII to IX
        let status = if (r.id >= 7 && r.id <= 9) {
            run_status
        } else {
            worst(r.status, run_status)
        };
        FactorResult {
            id: r.id,
            name: r.name,
            status: status,
            summary: r.summary,
            evidence: ev.concat(r.evidence),
        }
    })
}

function main() -> int {
    let argv = baml.sys.argv();
    let args = parse_args(argv.slice(imin(2, argv.length()), argv.length()));
    if (args.help) {
        baml.io.println(usage());
        baml.sys.exit(0);
    }
    let err = args.error;
    if (err != null || args.repo == null) {
        baml.io.eprintln((err ?? "Give the path of a repo to check.") + "\n\n" + usage());
        baml.sys.exit(2);
    }
    let root = args.repo ?? ".";
    let is_dir = baml.fs.read_dir(root) catch (e) {
        let e => null
    };
    if (is_dir == null) {
        baml.io.eprintln("Not a directory: " + root);
        baml.sys.exit(2);
    }

    let repo = open_repo(root);
    let ctx = build_context(repo, args.max_per_factor);
    let drafts = static_checks(ctx);
    let candidates = drafts
        .map((d: FactorDraft) -> int {
            d.candidates.length()
        })
        .reduce(
            (acc: int, n: int) -> int {
                acc + n
            },
            0,
        );

    let key = (
        baml.env.get("TYPESAFE_API_KEY") catch (e) {
            let e => null
        }
    )
        ?? "";
    let mode = args.judge
        ?? (
            if (key.length() > 0) {
                "jev"
            } else {
                "none"
            }
        );
    let judge_label = if (mode == "jev") {
        "Jev (" + args.model + ")"
    } else if (mode == "llm") {
        "LLM (BAML judge_llm)"
    } else if (args.judge == "none") {
        "off (--judge none)"
    } else {
        "off (TYPESAFE_API_KEY not set)"
    };
    if (mode == "jev" && key.length() == 0) {
        baml.io.eprintln("--judge jev needs TYPESAFE_API_KEY");
        baml.sys.exit(2);
    }
    if (mode != "none" && candidates > 0) {
        baml.io.eprintln("· asking the judge about " + string.from(candidates) + " item(s)");
    }
    let results = judge_all(
        drafts,
        JudgeOptions {
            mode: mode,
            api_key: key,
            model: args.model,
            thresholds: Thresholds { fail_at: args.fail_at, pass_at: args.pass_at },
            concurrency: 4,
        },
    );

    let runtime = "off";
    if (args.run) {
        let cfg = load_run_config(root);
        if (cfg == null) {
            runtime = "skipped (no twelve-factor.json)";
        } else {
            runtime = "on";
            results = merge_runtime(results, run_checks(root, cfg));
        }
    }

    let info = RunInfo {
        repo: basename(output_lines(sh(root, "pwd -P")).at(0) ?? root),
        files: repo.files.length(),
        judge: judge_label,
        runtime: runtime,
    };
    let report = if (args.json) {
        to_json(info, results)
    } else {
        to_markdown(info, results, args.verbose)
    };
    let out = args.out;
    if (out != null) {
        baml.fs.write(out, report);
        baml.io.eprintln("· wrote " + out);
    } else {
        baml.io.println(report);
    }
    let failed = results.some((r: FactorResult) -> bool {
        r.status == "fail"
    });
    baml.sys.exit(
        if (failed) {
            1
        } else {
            0
        },
    )
}

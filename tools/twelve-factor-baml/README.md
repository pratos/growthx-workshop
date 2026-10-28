# twelve-factor (BAML)

Checks a service against the original [Twelve-Factor App](https://12factor.net), written in [BAML](https://docs.boundaryml.com). It gives each factor a result of PASS, FAIL, REVIEW or n/a, with the file and line behind each finding. It does the same job as `../twelve-factor` (TypeScript), with the same results.

```sh
baml run main -- path/to/service               # from this folder
baml pack main --output twelve-factor          # or build a standalone binary
./twelve-factor path/to/service                # rules + Jev (needs TYPESAFE_API_KEY)
./twelve-factor path/to/service --no-jev       # rules only; fuzzy findings go to REVIEW
./twelve-factor path/to/service --judge llm    # judge with a BAML LLM function instead
./twelve-factor path/to/service --run          # also start the service (see below)
```

The exit code is 1 when any factor fails, so it can gate CI, and 2 for usage errors.

## Layout

| File | What it does |
| --- | --- |
| `baml_src/main.baml` | CLI: parses arguments, runs the checks, prints the report, sets the exit code |
| `baml_src/scan.baml` | Lists repo files (git or `find`), reads them, searches lines |
| `baml_src/factors.baml` | The twelve checks: rule evidence plus candidates for the judge |
| `baml_src/judge.baml` | Jev over HTTP, the `judge_llm` LLM function, thresholds, combining results |
| `baml_src/run.baml` | `--run`: starts the service, two copies, SIGTERM, migrations |
| `baml_src/report.baml` | Markdown and JSON output |
| `baml_src/checker.test.baml` | Tests (`baml test`) |

## How it decides

1. **Rules decide what code can decide.** A rule failure can't be cleared by the judge:
   - Is the repo in git? Is there a lockfile, and is it committed?
   - Are there secret keys or committed `.env` files?
   - Are there credentials inside a connection URL?
   - Does the server listen on a hard-coded port?
   - Is there a deploy config? Are there migrations, and a command that runs them?
2. **A judge decides what rules can't**, one snippet at a time. For example: should this literal be config? Must this in-memory state survive a restart? Would a second instance run this timer twice? The judge returns the probability that the snippet breaks the factor:
   - p ≥ 0.8 fails
   - p ≤ 0.2 passes
   - anything between goes to REVIEW

   Set the thresholds with `--fail-at` and `--pass-at`. If the judge is off or a call fails, the item goes to REVIEW; it is never passed silently.
   - **Jev** (`--judge jev`, the default when `TYPESAFE_API_KEY` is set) calls TypeSafe's `POST /v1/systemone` directly with `baml.http`. Its probabilities are calibrated, and a call takes well under a second.
   - **LLM** (`--judge llm`) calls `judge_llm`, a BAML function whose return type, `LlmVerdict`, is the output schema. It uses `anthropic/claude-haiku-5-5` and needs `ANTHROPIC_API_KEY`. The probability is the model's own estimate, so treat its thresholds more loosely.
3. **Runtime checks** (`--run`) start the service and watch it:
   - It must answer on the `PORT` it is given (VII).
   - A second copy must run beside the first (VIII).
   - It must finish a request that is in flight when it gets SIGTERM (IX).
   - The migration command must succeed (XII).

   For VII to IX, what the service actually does overrides what the source suggests. These checks run the target repo's own commands, so they need a `twelve-factor.json` in that repo:

   ```json
   { "start": "node server.js", "health": "/", "env": { "DATABASE_URL": "postgres://localhost/app" }, "migrate": "npm run migrate" }
   ```

## What goes to the judge

Only the code snippet in question, plus the file name and line. Secrets are masked before anything leaves the machine: keys, tokens, URL passwords and `password = "…"` values. The judge still sees that a literal was there. Text inside a snippet can still steer the judge, which is why rules and thresholds keep the final say.

## BAML notes for whoever edits this

These apply to the toolchain installed here (0.22.2):

- **Backtick strings process standard escapes.** In a regex, write a word boundary as `\\b` (a bare `\b` is a backspace) and a backtick as `\x60`. Never write a literal `${`, which starts interpolation.
- **`baml.sys.ProcessOptions.env` replaces the whole environment**, including `PATH` and `HOME`. `run.baml` sets extra variables with `export` lines inside the shell command instead.
- **`baml.sys.Process` has no pid.** The start wrapper writes `$$` to a file so the checker can send a real SIGTERM.
- **To parse LLM output in tests, use `baml.sap.parse<T>(text)`.** It is the same parser LLM functions use.

## Tests

```sh
baml test
```

There are 9 tests:
- **Bad fixture:** rule results.
- **Good fixture:** results, using a git copy of it.
- **Thresholds and judge outages:** checked with synthetic judgments, so no Jev calls.
- **Secrets never reach the judge,** and redaction masks them.
- **LLM reply parsing,** from canned text.
- **Runtime checks:** two of them, which actually start the good fixture.

None of the tests call Jev or an LLM.

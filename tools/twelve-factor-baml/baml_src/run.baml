// Runtime checks. These start the target service with commands from its own
// twelve-factor.json, so they only run with --run.

class RunConfig {
    /// Command that starts the service; it must bind to $PORT
    start: string,
    /// Path to request once it's up, default "/"
    health: string?,
    /// Extra environment, e.g. a local DATABASE_URL
    env: map<string, string>?,
    /// Command that applies migrations to the configured database
    migrate: string?,
    startupTimeoutMs: int?,
    shutdownTimeoutMs: int?,
}

function load_run_config(root: string) -> RunConfig? {
    let path = root + "/twelve-factor.json";
    let exists = baml.fs.exists(path) catch (e) {
        let e => false
    };
    if (!exists) {
        return null;
    }
    baml.json.from_string<RunConfig>(baml.fs.read(path))
}

class Instance {
    proc: baml.sys.Process,
    port: int,
    pid: string,
    log: string,
}

class StopResult {
    graceful: bool,
    ms: int,
}

function elapsed_ms(t0: baml.time.Instant) -> int {
    t0.elapsed().to_milliseconds().to_int() catch (e) {
        let e => 0
    }
}

function sleep_ms(ms: int) -> null {
    baml.sys.sleep(baml.time.Duration.from_milliseconds(ms))
}

function free_port() -> int {
    let rng = baml.random.SystemRandom.get();
    let tries = 0;
    while (tries < 50) {
        let port = 20000 + ((rng.random_int() % 40000) + 40000) % 40000;
        let listener = baml.net.TcpListener.bind("127.0.0.1:" + string.from(port)) catch (e) {
            let e => null
        };
        if (listener != null) {
            listener.close() catch (e) {
                let e => null
            };
            return port;
        }
        tries = tries + 1;
    }
    baml.sys.panic("no free port found")
}

function shell_quote(s: string) -> string {
    "'" + s.replace_all("'", "'\\''") + "'"
}

/// `export K='v';` lines. ProcessOptions.env replaces the whole environment (PATH and
/// HOME included), so extra variables are set inside the shell instead and the child
/// inherits everything else.
function exports(env: map<string, string>) -> string {
    env.keys()
        .map((k: string) -> string {
            "export " + k + "=" + shell_quote(env.get(k) ?? "") + "; "
        })
        .join("")
}

function run_shell(
    cwd: string,
    cmd: string,
    env: map<string, string>,
    timeout_ms: int,
) -> baml.sys.ShellOutput {
    baml.sys.exec(
        "sh",
        ["-c", exports(env) + cmd],
        baml.sys.ProcessOptions {
            cwd: cwd,
            env: null,
            timeout_ms: timeout_ms,
            stdin: null,
            stderr: baml.sys.StderrMode.Pipe,
        },
    )
}

function alive(pid: string) -> bool {
    let out = baml.sys.exec(
        "kill",
        ["-0", pid],
        baml.sys.ProcessOptions {
            cwd: null,
            env: null,
            timeout_ms: 5000,
            stdin: null,
            stderr: baml.sys.StderrMode.Discard,
        },
    ) catch (e) {
        let e => null
    };
    out != null && out.ok()
}

/// Send `sig` to the service and the processes it started
function signal(pid: string, sig: string) -> null {
    let quiet = baml.sys.ProcessOptions {
        cwd: null,
        env: null,
        timeout_ms: 5000,
        stdin: null,
        stderr: baml.sys.StderrMode.Discard,
    };
    let _a = baml.sys.exec("pkill", ["-" + sig, "-P", pid], quiet) catch (e) {
        let e => null
    };
    let _b = baml.sys.exec("kill", ["-" + sig, pid], quiet) catch (e) {
        let e => null
    };
    null
}

function start_instance(
    root: string,
    cfg: RunConfig,
    tmp: string,
    tag: string,
    port: int,
) -> Instance {
    let pidfile = tmp + "/" + tag + ".pid";
    let log = tmp + "/" + tag + ".log";
    let env: map<string, string> = { "PORT": string.from(port), "TF_START": cfg.start };
    for (let k in (cfg.env ?? {}).keys()) {
        env.set(k, (cfg.env ?? {}).get(k) ?? "");
    }
    // The wrapper records the service's pid and sends its output to a file, so the
    // pipes never fill up and the pid can receive a real SIGTERM
    let wrapper = exports(env)
        + "echo $$ > "
        + shell_quote(pidfile)
        + "; exec sh -c \"$TF_START\" > "
        + shell_quote(log)
        + " 2>&1";
    let proc = baml.sys.start_process(
        "sh",
        ["-c", wrapper],
        baml.sys.ProcessOptions {
            cwd: root,
            env: null,
            timeout_ms: null,
            stdin: null,
            stderr: baml.sys.StderrMode.Discard,
        },
    );
    let pid = "";
    let t0 = baml.time.Instant.now();
    while (pid == "" && elapsed_ms(t0) < 5000) {
        pid
            = (
                baml.fs.read(pidfile) catch (e) {
                    let e => ""
                }
            )
                .trim();
        if (pid == "") {
            sleep_ms(20);
        }
    }
    Instance { proc: proc, port: port, pid: pid, log: log }
}

function request(port: int, path: string, timeout_ms: int) -> int? {
    let req = baml.http.Request.from_url("http://127.0.0.1:" + string.from(port) + path)
        .set_method("GET")
        .set_timeout(baml.time.Duration.from_milliseconds(timeout_ms));
    let res = baml.http.send(req) catch (e) {
        let e => null
    };
    if (res == null) {
        return null;
    }
    let _body = res.text() catch (e) {
        let e => ""
    };
    res.status_code
}

/// Milliseconds until the service answered, or null if it never did
function wait_up(inst: Instance, path: string, timeout_ms: int) -> int? {
    let t0 = baml.time.Instant.now();
    while (elapsed_ms(t0) < timeout_ms) {
        if (request(inst.port, path, 1000) != null) {
            return elapsed_ms(t0);
        }
        if (inst.pid != "" && !alive(inst.pid)) {
            return null;
        }
        sleep_ms(250);
    }
    null
}

function stop_instance(inst: Instance, timeout_ms: int) -> StopResult {
    let t0 = baml.time.Instant.now();
    if (inst.pid != "") {
        signal(inst.pid, "TERM");
    }
    let graceful = true;
    while (inst.pid != "" && alive(inst.pid)) {
        if (elapsed_ms(t0) > timeout_ms) {
            signal(inst.pid, "KILL");
            graceful = false;
            break;
        }
        sleep_ms(50);
    }
    let ms = elapsed_ms(t0);
    inst.proc.close();
    StopResult { graceful: graceful, ms: ms }
}

function tail(inst: Instance) -> string {
    let lines = (
        baml.fs.read(inst.log) catch (e) {
            let e => ""
        }
    )
        .split("\n")
        .filter((l: string) -> bool {
            l.trim().length() > 0
        });
    let last = lines.slice(imax(0, lines.length() - 5), lines.length()).join(" | ");
    if (last.length() == 0) {
        "(none)"
    } else {
        clip(last, 400)
    }
}

function run_ev(verdict: Verdict, text: string) -> Evidence {
    Evidence { verdict: verdict, text: text, file: null, line: null, source: "run", p: null }
}

function add_ev(out: map<string, Evidence[]>, id: int, e: Evidence) -> null {
    let key = string.from(id);
    let list = out.get(key) ?? [];
    list.push(e);
    out.set(key, list);
    null
}

/// Evidence per factor id ("7", "8", "9", "12")
function run_checks(root: string, cfg: RunConfig) -> map<string, Evidence[]> {
    let out: map<string, Evidence[]> = {};
    let health = cfg.health ?? "/";
    let startup_timeout = cfg.startupTimeoutMs ?? 20000;
    let shutdown_timeout = cfg.shutdownTimeoutMs ?? 10000;
    let tmp = output_lines(sh(root, "mktemp -d")).at(0) ?? "/tmp";

    let migrate = cfg.migrate;
    if (migrate != null) {
        baml.io.eprintln("· running migrations: " + migrate);
        let res = run_shell(root, migrate, cfg.env ?? {}, 120000) catch (e) {
            let e => null
        };
        if (res != null && res.ok()) {
            add_ev(out, 12, run_ev("pass", "Migrations ran with one command (" + migrate + ")."));
        } else {
            let detail = if (res == null) {
                "timed out or couldn't start"
            } else {
                "exit "
                    + string.from(res.exit_code)
                    + ": "
                    + clip(
                        (
                            string.from_utf8(res.stderr) catch (e) {
                                let e => ""
                            }
                        )
                            .trim(),
                        300,
                    )
            };
            add_ev(out, 12, run_ev("fail", "Migration command failed (" + detail + ")."));
        }
    }

    // VII and IX: one instance on a port we choose
    let a = start_instance(root, cfg, tmp, "a", free_port());
    baml.io.eprintln("· starting: " + cfg.start + " (PORT=" + string.from(a.port) + ")");
    let up_ms = wait_up(a, health, startup_timeout);
    if (up_ms == null) {
        let _s = stop_instance(a, 2000);
        add_ev(
            out,
            7,
            run_ev(
                "fail",
                "Service didn't answer on the PORT it was given ("
                    + string.from(a.port)
                    + ") within "
                    + string.from(startup_timeout / 1000)
                    + "s. Last output: "
                    + tail(a),
            ),
        );
        add_ev(out, 9, run_ev("fail", "Couldn't test shutdown because the service never came up."));
        return out;
    }
    add_ev(out, 7, run_ev("pass", "Answered on the PORT it was given (" + string.from(a.port) + ")."));
    let startup = "Started in " + fmt2((up_ms ?? 0) / 1000.0) + "s.";
    add_ev(
        out,
        9,
        run_ev(
            if ((up_ms ?? 0) < 10000) {
                "pass"
            } else {
                "review"
            },
            startup,
        ),
    );

    // VIII: a second copy at the same time
    let b = start_instance(root, cfg, tmp, "b", free_port());
    let b_up = wait_up(b, health, startup_timeout);
    if (b_up != null && request(a.port, health, 2000) != null) {
        add_ev(out, 8, run_ev("pass", "Two instances ran side by side and both answered."));
    } else {
        add_ev(
            out,
            8,
            run_ev("fail", "A second instance didn't come up next to the first. Last output: " + tail(b)),
        );
    }
    let _sb = stop_instance(b, shutdown_timeout);

    // IX: SIGTERM with a request in flight
    let port = a.port;
    let inflight = spawn { request(port, health, shutdown_timeout) };
    sleep_ms(50);
    let stopped = stop_instance(a, shutdown_timeout);
    let answered = (await inflight) != null;
    if (!stopped.graceful) {
        add_ev(
            out,
            9,
            run_ev(
                "fail",
                "Didn't exit within "
                    + string.from(shutdown_timeout / 1000)
                    + "s of SIGTERM; had to be killed.",
            ),
        );
    } else if (!answered) {
        add_ev(
            out,
            9,
            run_ev(
                "review",
                "Exited "
                    + string.from(stopped.ms)
                    + "ms after SIGTERM, but dropped the request in flight.",
            ),
        );
    } else {
        add_ev(
            out,
            9,
            run_ev(
                "pass",
                "Finished the request in flight and exited "
                    + string.from(stopped.ms)
                    + "ms after SIGTERM.",
            ),
        );
    }
    let _rm = sh(root, "rm -rf '" + tmp + "'") catch (e) {
        let e => null
    };
    out
}

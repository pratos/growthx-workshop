// Shared types for the twelve-factor checker.

type Status = "pass" | "fail" | "review" | "n/a";

type Verdict = "pass" | "fail" | "review" | "info";

type Kind = "config" | "backing" | "state" | "job" | "logs" | "parity";

class Evidence {
    verdict: Verdict,
    text: string,
    file: string?,
    line: int?,
    /// rule | jev | llm | unjudged | run
    source: string,
    /// The judge's probability that this is a violation
    p: float?,
}

/// Something rules can't decide, sent to a judge (Jev or an LLM).
class Candidate {
    kind: Kind,
    file: string,
    line: int,
    text: string,
    snippet: string,
}

class FactorDraft {
    id: int,
    name: string,
    /// What the rules alone decided. Judged candidates can only make it worse.
    status: Status,
    summary: string,
    evidence: Evidence[],
    candidates: Candidate[],
}

class FactorResult {
    id: int,
    name: string,
    status: Status,
    summary: string,
    evidence: Evidence[],
}

function rule(verdict: Verdict, text: string) -> Evidence {
    Evidence { verdict: verdict, text: text, file: null, line: null, source: "rule", p: null }
}

function rule_at(verdict: Verdict, text: string, file: string, line: int?) -> Evidence {
    Evidence { verdict: verdict, text: text, file: file, line: line, source: "rule", p: null }
}

function draft(
    id: int,
    status: Status,
    summary: string,
    evidence: Evidence[],
    candidates: Candidate[],
) -> FactorDraft {
    let names = [
        "Codebase",
        "Dependencies",
        "Config",
        "Backing services",
        "Build, release, run",
        "Processes",
        "Port binding",
        "Concurrency",
        "Disposability",
        "Dev/prod parity",
        "Logs",
        "Admin processes",
    ];
    FactorDraft {
        id: id,
        name: names.at(id - 1) ?? "?",
        status: status,
        summary: summary,
        evidence: evidence,
        candidates: candidates,
    }
}

function rank(s: Status) -> int {
    if (s == "fail") {
        3
    } else if (s == "review") {
        2
    } else if (s == "pass") {
        1
    } else {
        0
    }
}

function worst(a: Status, b: Status) -> Status {
    if (rank(b) > rank(a)) {
        b
    } else {
        a
    }
}

function imax(a: int, b: int) -> int {
    if (a > b) {
        a
    } else {
        b
    }
}

function imin(a: int, b: int) -> int {
    if (a < b) {
        a
    } else {
        b
    }
}

function clip(s: string, n: int) -> string {
    if (s.length() > n) {
        s.slice(0, n)
    } else {
        s
    }
}

/// Two decimals, for probabilities in reports
function fmt2(p: float) -> string {
    string.from((p * 100.0).round() / 100.0)
}

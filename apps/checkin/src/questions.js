// Single source of truth for the form, server-side validation and the results view.
export const QUESTIONS = [
  { id: "role", text: "What do you mostly do?", scored: false, options: [
    { label: "Product management" },
    { label: "Design" },
    { label: "Growth or marketing" },
    { label: "Founder or business" },
    { label: "Engineering" },
    { label: "Data or analytics" },
  ]},
  { id: "prellm", text: "How much did you code before ChatGPT and other LLMs?", options: [
    { label: "Not at all", pts: 0 },
    { label: "Hobby level", sub: "Tutorials, scripts, spreadsheet formulas, small side projects", pts: 1 },
    { label: "Professionally, under 3 years", pts: 2 },
    { label: "Professionally, 3+ years", pts: 3 },
  ]},
  { id: "prod", text: "What's your experience with production code?", hint: "Code that real users depend on.", options: [
    { label: "I haven't worked on production code", pts: 0 },
    { label: "I've made small changes or fixes", pts: 1 },
    { label: "I ship and maintain features", pts: 2 },
    { label: "I own systems: deploys, incidents, on-call", pts: 3 },
  ]},
  { id: "brownfield", text: "Have you used AI on an existing codebase, not just new projects?", options: [
    { label: "I haven't used AI for code", pts: 0 },
    { label: "Only new projects I started from scratch", pts: 1 },
    { label: "Existing personal or small repos", pts: 2 },
    { label: "A large team or production codebase", sub: "Many contributors, history you didn't write", pts: 3 },
  ]},
  { id: "tools", text: "Which AI tools have you used to build something?", hint: "Pick all that apply.", multi: true, options: [
    { label: "Nothing yet", pts: 0, none: true },
    { label: "ChatGPT, Claude or Gemini chat", pts: 1 },
    { label: "App builders", sub: "Lovable, Bolt, v0, Replit", pts: 1 },
    { label: "AI code editors", sub: "Cursor, Windsurf, Copilot in VS Code", pts: 2 },
    { label: "Terminal coding agents", sub: "Claude Code, Codex CLI, Gemini CLI, Aider", pts: 3 },
  ]},
  { id: "terminal", text: "How comfortable are you in the terminal?", options: [
    { label: "I've never opened it", pts: 0 },
    { label: "I paste commands from guides", pts: 1 },
    { label: "I can move around folders, install packages and run a project", pts: 2 },
    { label: "I use it every day", pts: 3 },
  ]},
  { id: "debug", text: "When code from AI breaks, what do you usually do?", options: [
    { label: "I get stuck or start over", pts: 0 },
    { label: "I paste the error back and hope", pts: 1 },
    { label: "I read the error and give the AI more context", pts: 2 },
    { label: "I read the diff, find the cause, and add tests", pts: 3 },
  ]},
  { id: "git", text: "How well do you know git?", options: [
    { label: "What's git?", pts: 0 },
    { label: "I have a GitHub account, but I rarely use git", pts: 1 },
    { label: "I commit, push and use branches", pts: 2 },
    { label: "I review PRs, rebase, use worktrees", pts: 3 },
  ]},
  { id: "context", text: "Have you given an AI agent standing context or tools?", hint: "CLAUDE.md or rules files, MCP servers, custom commands, skills, hooks.", options: [
    { label: "I don't know what these are", pts: 0 },
    { label: "I've heard of them", pts: 1 },
    { label: "I've set up one or two", pts: 2 },
    { label: "I have my own setup and tune it", pts: 3 },
  ]},
  { id: "goal", text: "What do you most want from this session?", scored: false, options: [
    { label: "Build my first thing with AI" },
    { label: "Move from chat or app builders to a real coding agent" },
    { label: "Use agents well on a real codebase" },
    { label: "Advanced workflows: parallel agents, automation, custom tooling" },
  ]},
  { id: "learn", text: "What do you want to learn from this workshop?", type: "text", scored: false, optional: true, maxLength: 500,
    hint: "Optional. A topic, a tool, or a problem you're stuck on. Please leave out names." },
];

// Only shown on the host's results page; participants never see a level.
export const LEVELS = [
  { n: 1, name: "Explorer", min: 0, max: 6,
    focus: "What an agent is and how it differs from chat. Installation walkthrough. One guided build end to end. Keep terminal jargon to a minimum." },
  { n: 2, name: "Prototyper", min: 7, max: 13,
    focus: "The jump from Lovable or ChatGPT to Claude Code or Cursor. Git as a safety net. Reading errors and handing the agent context." },
  { n: 3, name: "Builder", min: 14, max: 19,
    focus: "Context: CLAUDE.md and rules files, plan mode, MCP. Reviewing diffs. Tests as guardrails. Breaking work into agent-sized tasks." },
  { n: 4, name: "Operator", min: 20, max: 24,
    focus: "Parallel agents and worktrees, subagents and skills, hooks, headless runs in CI, evaluating agent output." },
];

export const MAX_SCORE = QUESTIONS.filter(q => q.scored !== false).length * 3;

export function scoreOf(answers) {
  let total = 0;
  for (const q of QUESTIONS) {
    if (q.scored === false) continue;
    total += Math.max(...answers[q.id].map(j => q.options[j].pts));
  }
  return total;
}

export function levelOf(score) {
  return LEVELS.find(l => score >= l.min && score <= l.max);
}

// Returns normalized answers ({id: [optionIndex, ...]}) or null if anything is off.
export function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const out = {};
  for (const q of QUESTIONS) {
    const v = body[q.id];
    if (q.type === "text") {
      if (v === undefined || v === null) { if (q.optional) continue; return null; }
      if (typeof v !== "string") return null;
      const t = v.trim();
      if (t.length > q.maxLength) return null;
      if (!t && !q.optional) return null;
      if (t) out[q.id] = t;
      continue;
    }
    if (!Array.isArray(v) || v.length === 0) return null;
    const picks = [...new Set(v)];
    if (!picks.every(j => Number.isInteger(j) && j >= 0 && j < q.options.length)) return null;
    if (!q.multi && picks.length !== 1) return null;
    const none = q.options.findIndex(o => o.none);
    if (none >= 0 && picks.includes(none) && picks.length > 1) return null;
    out[q.id] = picks.sort((a, b) => a - b);
  }
  return out;
}

# Trying Greenhouse

The finished product, on your laptop: a planning room where people and an agent write a plan together. The plan's comments end in decisions; a chat panel beside it is where people ask the agent, and everyone in the room sees each step.

## Start it

```sh
nix develop         # optional: the whole toolchain, same on every laptop and agent sandbox
just install        # once: dependencies, skills, git hooks
just reset          # fresh local database and plan rooms, migrated and seeded
just up             # web and API on http://localhost:3000
just agent-serve    # second terminal: the agent, answering questions on plan gh-12
```

Without a model key the agent answers with a faux model that echoes your question, so everything works offline. For real answers, start `just agent-serve` with `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) in the environment.

## Sign in as

The seed opens three local-only accounts; the logins are in `.dev.vars.example`.

| Who | Email | What they can do |
|---|---|---|
| Admin | `admin@greenhouse.test` | everything, including `/admin` |
| Sam | `sam@greenhouse.test` | a participant: comments, sessions; no admin |
| Agent | `agent@greenhouse.test` | used by `just agent-serve`; you don't sign in as it |

## Things to try

1. **Sign up** at `/signup` with any email and a password of 12 or more characters. You land signed in.
2. **Admin**: sign in as Admin, open `/admin`. Accounts, live sign-ins, flags, and the event log with every password and token masked. Sign in as Sam and `/admin` refuses, and says why.
3. **The plan**: open `/plans/gh-12`. Open a thread on a block, then resolve it into a decision. As Sam, Resolve is missing: the `resolve-thread` flag is on only for admin and pratos. Turn it on for Sam with `just flag user resolve-thread sam`, switch back to the tab, and Resolve appears.
4. **Two people, one room**: open the same plan in a second browser (or a private window) signed in as the other account. A thread opened in one appears in the other at once.
5. **Talk to the agent**: in the panel on the right, start a session and ask. The agent picks it up within a couple of seconds and answers. In the other browser, join the session, ask too, or steer a question while the agent works on it.
6. **Kill the agent mid-answer**: with a real model key, ask a long question, `kill -9` the `agent-serve` process while it is working, and start it again. The run resumes and is answered once.
7. **Read what happened**: `/admin/events` shows every fact recorded, by stream.

## Checks you can run

```sh
just test                     # unit and story tests: engine, domain, agent, API
just e2e                      # the browser tests (starts the app if :3000 is free)
just domain-vocabulary-check  # code and the vocabulary agree
just agent-ready              # an agent could run this repo alone
```

The stories read like what happened: `packages/domain/src/*/__expect__/` and `packages/agent/test/__expect__/`.

## Deploying

From GitHub: `docs/DEPLOY.md` (secrets, the first deploy, what each failure means).

// Everything behind the Hono edge will be a service with a Layer; the first ones arrive with the features that need them.
// AUTH_LIMIT and WRITE_LIMIT are Workers rate-limit bindings (optional: tests and a bare `wrangler dev` run without them).
export type Env = { DB: D1Database; VERSION?: { id: string; tag: string }; GIT_DESCRIBE?: string; AUTH_LIMIT?: RateLimit; WRITE_LIMIT?: RateLimit };

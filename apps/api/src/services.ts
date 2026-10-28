// Everything behind the Hono edge will be a service with a Layer; the first ones arrive with the features that need them.
export type Env = { DB: D1Database; VERSION?: { id: string; tag: string }; GIT_DESCRIBE?: string };

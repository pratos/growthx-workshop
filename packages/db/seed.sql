-- Local seed. Never run against prod. Logins are in .dev.vars.example; the hashes below are of those local-only passwords.
INSERT OR REPLACE INTO users (id, email, name, role, password_hash) VALUES
  ('admin', 'admin@greenhouse.test', 'Admin', 'admin', 'pbkdf2$100000$tAEvn3LsKooWfMiUgvKlCg==$oemyVYzdtxaHCWxAPsHr+N7/i2FLZ8kWUbGwlG7emIw='),
  ('sam', 'sam@greenhouse.test', 'Sam', 'member', 'pbkdf2$100000$t5B6IDlEJz4DEEYcFV3Lhg==$qX/nO9HuGhwV1jVcsLApdIs5bXJ20ycMOnwZ+Kqtb28=');
-- Flags default off; the allowlist turns one on for named participants.
INSERT OR REPLACE INTO flags (name, enabled, allowlist, percent) VALUES ('resolve-thread', 0, 'admin,pratos', 0);

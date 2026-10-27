-- Local seed: flags default off except for the two seeded participants. Never run against prod.
INSERT OR REPLACE INTO flags (name, enabled, allowlist, percent) VALUES ('resolve-thread', 0, 'admin,pratos', 0);

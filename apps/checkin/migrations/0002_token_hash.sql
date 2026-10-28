-- Adds the hashed per-browser token so a resubmission replaces earlier answers.
ALTER TABLE responses ADD COLUMN token_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS responses_token_hash ON responses (token_hash);

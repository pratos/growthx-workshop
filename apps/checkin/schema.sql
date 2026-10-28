CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  answers TEXT NOT NULL,
  created_on TEXT NOT NULL,
  token_hash TEXT
);
CREATE INDEX IF NOT EXISTS responses_created_on ON responses (created_on);
CREATE UNIQUE INDEX IF NOT EXISTS responses_token_hash ON responses (token_hash);

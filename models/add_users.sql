CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY, 
    email           TEXT, 
    password        TEXT
);

ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
UPDATE notes SET user_id = 0;
ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;

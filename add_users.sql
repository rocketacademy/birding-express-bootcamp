CREATE TABLE users (
    id              SERIAL PRIMARY KEY, 
    email           TEXT, 
    password        TEXT
);

ALTER TABLE notes ADD COLUMN user_id INTEGER;
UPDATE notes SET user_id = 0;
ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;

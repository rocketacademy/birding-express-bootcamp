CREATE TABLE IF NOT EXISTS comments (
    id          SERIAL PRIMARY KEY, 
    text        TEXT,
    notes_id    INTEGER REFERENCES notes(id),
    user_id     INTEGER REFERENCES users(id),
    date_time   timestamptz        
);

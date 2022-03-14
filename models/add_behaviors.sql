CREATE TABLE IF NOT EXISTS behaviors (
    id              SERIAL PRIMARY KEY, 
    behavior        TEXT
);

CREATE TABLE IF NOT EXISTS behaviors_notes (
    id              SERIAL PRIMARY KEY, 
    behaviors_id    INTEGER,
    notes_id        INTEGER
);

ALTER TABLE notes DROP COLUMN behavior;

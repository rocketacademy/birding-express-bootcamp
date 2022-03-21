CREATE TABLE IF NOT EXISTS notes (
    id              SERIAL PRIMARY KEY,
    habitat         TEXT,
    date            TIMESTAMPTZ,
    appearance      TEXT,
    behavior        TEXT,
    vocalisations   TEXT,
    flock_size      INTEGER
);

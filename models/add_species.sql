CREATE TABLE IF NOT EXISTS species (
    id              SERIAL PRIMARY KEY, 
    name            TEXT, 
    scientific_name TEXT
);

ALTER TABLE notes ADD COLUMN IF NOT EXISTS species_id INTEGER REFERENCES species(id);

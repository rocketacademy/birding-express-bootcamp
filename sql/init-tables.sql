DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS species;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS behaviours;
DROP TABLE IF EXISTS note_behaviour;

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  date_of_sighting DATE,
  appearance TEXT,
  flock_size TEXT,
  user_id INTEGER,
  species_id INTEGER
);
CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT, password TEXT, username TEXT);
CREATE TABLE species (id SERIAL PRIMARY KEY, name TEXT, scientific_name TEXT);
CREATE TABLE behaviours (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE note_behaviour (note_id INTEGER, behaviour_id INTEGER);

-- command to run this file: psql -f <PATH_TO_FILE> OR \i <PATH_TO_FILE>
-- \i /home/eddiejpot/rocket-academy/bootcamp/projects/course-projects/bird-watching/sql/init-tables.sql

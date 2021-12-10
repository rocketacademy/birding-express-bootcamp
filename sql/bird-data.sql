
CREATE TABLE note_behaviour (note_id INTEGER, behaviour_id INTEGER);

-- User Data
INSERT INTO users (email, password, username) VALUES ('porter@gmail.com', 'd404559f602eab6fd602ac7680dacbfaadd13630335e951f097af3900e9de176b6db28512f2e000b9d04fba5133e8b1c6e8df59db3a8ab9d60be4b97cc9e81db', 'porter');
INSERT INTO users (email, password, username) VALUES ('user2@gmail.com', 'd404559f602eab6fd602ac7680dacbfaadd13630335e951f097af3900e9de176b6db28512f2e000b9d04fba5133e8b1c6e8df59db3a8ab9d60be4b97cc9e81db', 'user two');
INSERT INTO users (email, password, username) VALUES ('user3@gmail.com', 'd404559f602eab6fd602ac7680dacbfaadd13630335e951f097af3900e9de176b6db28512f2e000b9d04fba5133e8b1c6e8df59db3a8ab9d60be4b97cc9e81db', 'user three');

-- Species data
INSERT INTO species (name, scientific_name) VALUES ('Northern Pintail', 'Anas acuta');
INSERT INTO species (name, scientific_name) VALUES ('King Quail', 'Excalfactoria chinensis');
INSERT INTO species (name, scientific_name) VALUES ('Red Junglefowl', 'Gallus gallus');
INSERT INTO species (name, scientific_name) VALUES ('Wandering Whistling Duck', 'Dendrocygna arcuata');
INSERT INTO species (name, scientific_name) VALUES ('Garganey', 'Spatula querquedula');
INSERT INTO species (name, scientific_name) VALUES ('Large-tailed Nightjar', 'Caprimulgus macrurus');

-- Behaviours data
INSERT INTO behaviours (name) VALUES ('Walking');
INSERT INTO behaviours (name) VALUES ('Resting');
INSERT INTO behaviours (name) VALUES ('Gathering Nesting Materials');
INSERT INTO behaviours (name) VALUES ('Mobbing');
INSERT INTO behaviours (name) VALUES ('Long Song');
INSERT INTO behaviours (name) VALUES ('Bathing');
INSERT INTO behaviours (name) VALUES ('Hunting');
INSERT INTO behaviours (name) VALUES ('Flying');

-- Notes Data
INSERT INTO notes (date_of_sighting, appearance, flock_size, user_id, species_id) VALUES ('2021-02-10', 'looking good walking and resting', '1', 1, 1);
INSERT INTO notes (date_of_sighting, appearance, flock_size, user_id, species_id) VALUES ('2020-03-10', 'red and white bird hunting and flying', '>10', 2, 2);

-- note_behaviour
INSERT INTO note_behaviour (note_id, behaviour_id) VALUES (1, 1);
INSERT INTO note_behaviour (note_id, behaviour_id) VALUES (1, 2);
INSERT INTO note_behaviour (note_id, behaviour_id) VALUES (2, 7);
INSERT INTO note_behaviour (note_id, behaviour_id) VALUES (2, 8);


-- command to run this file: psql -f <PATH_TO_FILE> OR \i <PATH_TO_FILE>
-- \i /home/eddiejpot/rocket-academy/bootcamp/projects/course-projects/bird-watching/sql/bird-data.sql


SELECT behaviours.name FROM note_behaviour INNER JOIN behaviours ON behaviours.id = note_behaviour.behaviour_id WHERE note_behaviour.note_id = 1;

SELECT note_behaviour.behaviour_id FROM behaviours INNER JOIN note_behaviour ON note_behaviour.behaviour_id = behaviours.id WHERE note_behaviour.note_id = 1;
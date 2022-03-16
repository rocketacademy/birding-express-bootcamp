import { Router } from 'express';
import moment from 'moment';
import pool from '../utils/dbConnect.js';
import {
  isLoggedIn, getSpecies, getBehaviors, getComments,
} from '../utils/helper.util.js';

const router = Router();

/**
 * Check if note data is valid.
 * @param {object} data Note data.
 * @returns True if valid, False otherwise.
 */
// eslint-disable-next-line no-restricted-globals, max-len
const isNoteDataValid = (data) => moment(data.date).isValid() && moment(data.date).isSameOrBefore(moment()) && !isNaN(data.flockSize);

/**
 * Get new note form.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getNewNote = async (req, res) => {
  if (!isLoggedIn(req)) {
    res.redirect('/login');
    return;
  }

  const species = await getSpecies();
  const behaviors = await getBehaviors();

  res.render('edit', { source: 'new', species, behaviors });
};

/**
 * Add new note.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Redirection to newly added note page.
 */
const createNote = (req, res) => {
  const {
    habitat, date, appearance, vocalisations, flockSize, species, behaviorIDs,
  } = req.body;

  // validate note data
  if (!isNoteDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

  const query = 'insert into notes (habitat, date, appearance, vocalisations, flock_size, user_id, species_id) values ($1, $2, $3, $4, $5, $6, $7) returning id';
  const inputData = [
    // eslint-disable-next-line max-len
    habitat, date, appearance, vocalisations, flockSize, req.cookies.user.id, (species) || null];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

    behaviorIDs.forEach((behaviorID) => {
      const manyToManyQuery = `insert into behaviors_notes (behaviors_id, notes_id) values ($1, ${result.rows[0].id})`;

      pool.query(manyToManyQuery, [behaviorID], (error) => {
        if (error) {
          console.log('Error executing query', err.stack);
          res.status(503).send(result.rows);
        }
      });
    });

    res.redirect(`/note/${result.rows[0].id}`);
  });
};

/**
 * Get edit note form.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Edit note page.
 */
const getEditNote = (req, res) => {
  if (!isLoggedIn(req)) {
    res.redirect('/login');
    return;
  }

  const { id } = req.params;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(id)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  const query = 'select * from notes where id=$1';
  const inputData = [id];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

    const note = result.rows[0];

    // if requested note is not created by logged in user, then redirect to home page
    if (req.cookies.user.id !== note.user_id) {
      res.redirect('/');
      return;
    }

    note.date = moment(note.date).format('dddd, MMMM D, YYYY');

    const behaviorQuery = 'select b.id from behaviors_notes bn inner join behaviors b on bn.behaviors_id=b.id where bn.notes_id=$1';

    pool.query(behaviorQuery, inputData, async (error, results) => {
      if (error) {
        console.log('Error executing query', err.stack);
        res.status(503).send(result.rows);
        return;
      }
      note.behaviorIDs = results.rows.map((behavior) => behavior.id);

      const species = await getSpecies();
      const behaviors = await getBehaviors();

      res.render('edit', {
        note, source: 'edit', species, behaviors,
      });
    });
  });
};

/**
 * Edit a note.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Redirection to edited note page.
 */
const editNote = (req, res) => {
  const { id } = req.params;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(id)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  const {
    habitat, date, appearance, vocalisations, flockSize, species, behaviorIDs,
  } = req.body;

  // validate note data
  if (!isNoteDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

  // TODO: Refactor to avoid triple nested queries

  const query = 'update notes set habitat=$1, date=$2, appearance=$3, vocalisations=$4, flock_size=$5, species_id=$6 where id=$7';

  // eslint-disable-next-line max-len
  const inputData = [habitat, date, appearance, vocalisations, flockSize, (species) || null, id];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

    const resetQuery = 'delete from behaviors_notes where notes_id=$1';

    pool.query(resetQuery, [id], (resetError) => {
      if (resetError) {
        console.log('Error executing query', resetError.stack);
        res.status(503).send(result.rows);
        return;
      }

      if (behaviorIDs) {
        let behaviorList = behaviorIDs;
        if (!Array.isArray(behaviorIDs)) {
          behaviorList = [behaviorIDs];
        }

        behaviorList.forEach((behaviorID) => {
          const manyToManyQuery = `insert into behaviors_notes (behaviors_id, notes_id) values ($1, ${id})`;

          pool.query(manyToManyQuery, [behaviorID], (error) => {
            if (error) {
              console.log('Error executing query', error.stack);
              res.status(503).send(result.rows);
            }
          });
        });
      }

      res.redirect(`/note/${id}`);
    });
  });
};

/**
 * Get note page by ID.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Note page.
 */
const getNoteByID = (req, res) => {
  const { id } = req.params;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(id)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  const query = 'select n.*, u.email, s.name as species_name, s.scientific_name as species_scientific_name from notes n left join users u on n.user_id=u.id left join species s on n.species_id=s.id where n.id=$1';
  const inputData = [id];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

    const note = result.rows[0];

    const behaviorQuery = 'select b.behavior from behaviors_notes bn inner join behaviors b on bn.behaviors_id=b.id where bn.notes_id=$1';

    pool.query(behaviorQuery, inputData, async (error, results) => {
      if (error) {
        console.log('Error executing query', error.stack);
        res.status(503).send(results.rows);
        return;
      }
      const behaviors = results.rows;
      const comments = await getComments(id);

      if (note) {
        note.date = moment(note.date).format('dddd, MMMM D, YYYY');
        comments.forEach((comment) => {
          comment.date_time = moment(comment.date_time).fromNow();
        });

        res.render('note', {
          note, source: `note-${id}`, behaviors, comments,
        });
      } else {
        res.status(404).send('Sorry, we cannot find that!');
      }
    });
  });
};

/**
 * Delete note.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Redirection to home page.
 */
const deleteNoteByID = (req, res) => {
  const { id } = req.params;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(id)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  const query = 'delete from notes where id=$1';
  const inputData = [id];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

    res.redirect(`/users/${req.cookies.user.id}`);
  });
};

router
  .route('/')
  .get((req, res) => getNewNote(req, res))
  .post((req, res) => createNote(req, res));

router
  .route('/:id')
  .get((req, res) => getNoteByID(req, res))
  .put((req, res) => editNote(req, res))
  .delete((req, res) => deleteNoteByID(req, res));

router
  .route('/:id/edit')
  .get((req, res) => getEditNote(req, res));

export default router;

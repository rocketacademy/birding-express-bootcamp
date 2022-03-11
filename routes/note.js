import { Router } from 'express';
import moment from 'moment';
import pool from '../dbConnect.js';
import { isLoggedIn, getSpecies } from '../utils/helper.util.js';

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

  res.render('edit', { source: 'new', species });
};

/**
 * Add new note.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Redirection to newly added note page.
 */
const createNote = (req, res) => {
  const {
    habitat, date, appearance, behavior, vocalisations, flockSize, species,
  } = req.body;

  // validate note data
  if (!isNoteDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

  const query = 'insert into notes (habitat, date, appearance, behavior, vocalisations, flock_size, user_id, species_id) values ($1, $2, $3, $4, $5, $6, $7, $8) returning id';
  const inputData = [
    // eslint-disable-next-line max-len
    habitat, date, appearance, behavior, vocalisations, flockSize, req.cookies.user.id, (species) || null];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

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

  pool.query(query, inputData, async (err, result) => {
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

    const species = await getSpecies();

    res.render('edit', { note, source: 'edit', species });
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
    habitat, date, appearance, behavior, vocalisations, flockSize, species,
  } = req.body;

  // validate note data
  if (!isNoteDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

  const query = 'update notes set habitat=$1, date=$2, appearance=$3, behavior=$4, vocalisations=$5, flock_size=$6, species_id=$7 where id=$8';

  // eslint-disable-next-line max-len
  const inputData = [habitat, date, appearance, behavior, vocalisations, flockSize, (species) || null, id];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

    res.redirect(`/note/${id}`);
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

    if (note) {
      note.date = moment(note.date).format('dddd, MMMM D, YYYY');
      res.render('note', { note, source: `note-${id}` });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
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

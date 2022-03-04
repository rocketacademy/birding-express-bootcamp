import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import moment from 'moment';
import cookieParser from 'cookie-parser';
import { compare } from './compare.js';

// Initialise DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'hirawan',
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port
};
const pool = new Pool(pgConnectionConfigs);

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

app.set('view engine', 'ejs');

moment().format();
moment.suppressDeprecationWarnings = true;

/**
 * Get new note form.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getNewNote = (req, res) => {
  res.render('edit', { source: 'new' });
};

/**
 * Check if note data is valid.
 * @param {object} data Note data.
 * @returns True if valid, False otherwise.
 */
// eslint-disable-next-line no-restricted-globals, max-len
const isNoteDataValid = (data) => moment(data.date).isValid() && moment(data.date).isSameOrBefore(moment()) && !isNaN(data.flockSize);

/**
 * Add new note.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Redirection to newly added note page.
 */
const createNote = (req, res) => {
  const {
    habitat, date, appearance, behavior, vocalisations, flockSize,
  } = req.body;

  // validate note data
  if (!isNoteDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

  const query = 'insert into notes (habitat, date, appearance, behavior, vocalisations, flock_size) values ($1, $2, $3, $4, $5, $6) returning id';
  const inputData = [habitat, date, appearance, behavior, vocalisations, flockSize];

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
 * Get list of notes.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getNotes = (req, res) => {
  const query = 'select * from notes';

  pool.query(query, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }
    const notes = result.rows;

    // sort list
    const { sortBy, sortOrder } = req.query;
    if (sortBy) {
      notes.sort((first, second) => compare(first, second, sortBy, sortOrder));
    }

    // format date
    notes.forEach((note) => {
      note.date = moment(note.date).format('dddd, MMMM D, YYYY');
    });

    if (notes.length > 0) {
      res.render('notes', {
        notes, source: 'root', sortBy, sortOrder,
      });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

/**
 * Get edit note form.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Edit note page.
 */
const getEditNote = (req, res) => {
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
    note.date = moment(note.date).format('dddd, MMMM D, YYYY');

    res.render('edit', { note, source: 'edit' });
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
    habitat, date, appearance, behavior, vocalisations, flockSize,
  } = req.body;

  // validate note data
  if (!isNoteDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

  const query = 'update notes set habitat=$1, date=$2, appearance=$3, behavior=$4, vocalisations=$5, flock_size=$6 where id=$7';
  const inputData = [habitat, date, appearance, behavior, vocalisations, flockSize, id];

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

  const query = 'select * from notes where id=$1';
  const inputData = [id];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

    const note = result.rows[0];
    note.date = moment(note.date).format('dddd, MMMM D, YYYY');

    if (note) {
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

    res.redirect('/');
  });
};

app.get('/note', getNewNote);
app.post('/note', createNote);
app.get('/note/:id', getNoteByID);
app.get('/', getNotes);

app.get('/note/:id/edit', getEditNote);
app.put('/note/:id', editNote);
app.delete('/note/:id', deleteNoteByID);

// start the server listening for requests
app.listen(process.env.PORT || 3004, () => console.log('Server is running...'));

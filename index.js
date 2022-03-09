import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import moment from 'moment';
import cookieParser from 'cookie-parser';
import jsSHA from 'jssha';
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

app.use((req, res, next) => {
  res.locals.user = req.cookies.user;
  next();
});

app.set('view engine', 'ejs');

moment().format();
moment.suppressDeprecationWarnings = true;

/**
 * Check if note data is valid.
 * @param {object} data Note data.
 * @returns True if valid, False otherwise.
 */
// eslint-disable-next-line no-restricted-globals, max-len
const isNoteDataValid = (data) => moment(data.date).isValid() && moment(data.date).isSameOrBefore(moment()) && !isNaN(data.flockSize);

/**
 * Check if user is logged in.
 * @returns True, if logged in. False, otherwise.
 */
const isLoggedIn = (req) => (req.cookies && req.cookies.user);

/**
 * Get list of species.
 */
const getSpecies = async () => {
  const query = 'select id, name, scientific_name from species order by name';

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.log('Error executing query', err.stack);
    return null;
  }
};

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
 * Get list of notes.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getNotes = (req, res) => {
  const query = 'select n.*, u.email, s.name as species_name, s.scientific_name as species_scientific_name from notes n left join users u on n.user_id=u.id left join species s on n.species_id=s.id';

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

/**
 * Get hash value of a text.
 * @param {*} text Text to hash.
 * @returns Hash value of a text.
 */
const getHashValue = (text) => {
  // eslint-disable-next-line new-cap
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(text);
  return shaObj.getHash('HEX');
};

/**
 * Create a new user.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Redirection to login page.
 */
const createUser = (req, res) => {
  const query = 'insert into users (email, password) values($1, $2)';

  const hashedPassword = getHashValue(req.body.password);
  const inputData = [req.body.email, hashedPassword];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

    res.redirect('/login');
  });
};

/**
 * Get user login form.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getUserLogin = (req, res) => {
  res.render('login', { source: 'login', error: '' });
};

/**
 * Log a user in.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Redirection to home page.
 */
const logUserIn = (req, res) => {
  const query = 'select * from users where email=$1';
  const inputData = [req.body.email];

  pool.query(query, inputData, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }

    if (result.rows.length === 0) {
      // we didnt find a user with that email.
      res.status(401).render('login', { source: 'login', error: 'The login information is incorrect.' });
      return;
    }

    const user = result.rows[0];

    if (user.password === getHashValue(req.body.password)) {
      res.cookie('user', { id: user.id, email: user.email });
      res.redirect('/');
    } else {
      // password didn't match
      res.status(401).render('login', { source: 'login', error: 'The login information is incorrect.' });
    }
  });
};

/**
 * Log a user out.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Redirection to login page.
 */
const logUserOut = (req, res) => {
  res.clearCookie('user');
  res.redirect('/');
};

/**
 * Get list of notes made by a user.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getUserNotesByID = (req, res) => {
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

  // if requested id is not own id, then redirect to own users page
  if (req.cookies.user.id !== Number(id)) {
    res.redirect(`/users/${req.cookies.user.id}`);
    return;
  }

  const query = 'select n.*, u.email, s.name as species_name, s.scientific_name as species_scientific_name from notes n left join users u on n.user_id=u.id left join species s on n.species_id=s.id where n.user_id=$1';
  const inputData = [id];

  pool.query(query, inputData, (err, result) => {
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

    res.render('users', {
      notes, source: 'users', sortBy, sortOrder,
    });
  });
};

app.get('/note', getNewNote);
app.post('/note', createNote);
app.get('/note/:id', getNoteByID);
app.get('/', getNotes);
app.get('/note/:id/edit', getEditNote);
app.put('/note/:id', editNote);
app.delete('/note/:id', deleteNoteByID);

app.post('/signup', createUser);
app.get('/login', getUserLogin);
app.post('/login', logUserIn);
app.delete('/logout', logUserOut);
app.get('/users/:id', getUserNotesByID);

// start the server listening for requests
app.listen(process.env.PORT || 3004, () => console.log('Server is running...'));

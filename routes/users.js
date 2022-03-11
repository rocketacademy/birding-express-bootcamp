import { Router } from 'express';
import moment from 'moment';
import pool from '../dbConnect.js';
import { compare } from '../compare.js';
import { isLoggedIn } from '../utils/helper.util.js';

const router = Router();

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

router
  .route('/:id')
  .get((req, res) => getUserNotesByID(req, res));

export default router;

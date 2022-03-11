import { Router } from 'express';
import moment from 'moment';
import pool from '../dbConnect.js';
import { compare } from '../compare.js';

const router = Router();

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

router
  .route('/')
  .get((req, res) => getNotes(req, res));

export default router;

import { Router } from 'express';
import pool from '../utils/dbConnect.js';
import { compare } from '../utils/compare.js';

const router = Router();

/**
 * Get list of notes.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getSpecies = (req, res) => {
  const query = 'select * from species order by name';

  pool.query(query, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }
    const species = result.rows;

    // sort list
    const { sortBy, sortOrder } = req.query;
    if (sortBy) {
      species.sort((first, second) => compare(first, second, sortBy, sortOrder));
    }

    if (species.length > 0) {
      res.render('species', {
        species, source: 'species', sortBy, sortOrder,
      });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

router
  .route('/all')
  .get((req, res) => getSpecies(req, res));

export default router;

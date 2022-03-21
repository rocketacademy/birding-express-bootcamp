import { Router } from 'express';
import pool from '../utils/dbConnect.js';
import { compare } from '../utils/compare.js';

const router = Router();

/**
 * Get list of behaviors.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getBehaviors = (req, res) => {
  const query = 'select * from behaviors order by behavior';

  pool.query(query, (err, result) => {
    if (err) {
      console.log('Error executing query', err.stack);
      res.status(503).send(result.rows);
      return;
    }
    const behaviors = result.rows;

    // sort list
    const { sortBy, sortOrder } = req.query;
    if (sortBy) {
      behaviors.sort((first, second) => compare(first, second, sortBy, sortOrder));
    }

    if (behaviors.length > 0) {
      res.render('behaviors', {
        behaviors, source: 'behaviors', sortBy, sortOrder,
      });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

router
  .route('/')
  .get((req, res) => getBehaviors(req, res));

export default router;

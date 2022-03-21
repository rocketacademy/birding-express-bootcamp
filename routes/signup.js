import { Router } from 'express';
import pool from '../utils/dbConnect.js';
import { getHashValue } from '../utils/helper.util.js';

const router = Router();

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

router
  .route('/')
  .post((req, res) => createUser(req, res));

export default router;

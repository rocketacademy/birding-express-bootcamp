import express, { urlencoded } from 'express';
import pg from 'pg';

const pgConnectionConfigs = {
  user: 'kennethongcs',
  host: 'localhost',
  database: 'birding',
  port: 5432,
};

const { Pool } = pg;
const pool = new Pool(pgConnectionConfigs);
const app = express();

// TODO
// 1. data validation
// 2. /note/:index page

// to use ejs
app.set('view engine', 'ejs');
// to use 'public' folder
app.use(express.static('public'));
// to use req.body for retrieving form data
app.use(urlencoded({ extended: false }));

/**
 * GET for index page
 */
app.get('/', (req, res) => {
  const sqlQuery = 'SELECT * FROM notes';

  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log('Error found:', err);
      res.status(503).send(result.rows);
      return;
    }
    // logic for result below
    const data = result.rows; // returns an array of obj
    res.render('index', { data });
  });
});

/**
 * GET for 'note' page to render a form
 */
app.get('/note', (req, res) => {
  // add query to db to get data
  res.render('form');
});

/**
 * POST for 'note' page to render a form
 */
app.post('/note', (req, res) => {
  // get data from form using req.body
  const insert = Object.values(req.body);
  console.log(insert);
  const query =
    'INSERT INTO notes (date, time, day, behavior) VALUES($1, $2, $3, $4) ';

  pool.query(query, insert, (err, result) => {
    if (err) {
      console.log('Write error: ', err);
      res.status(504).send('Write error, please contact server administrator.');
    }
    console.log(result.rows);
  });
  res.send('Thanks for your submission.');
});

/**
 * GET for 'note' page to render a form
 */
app.get('/note/:id', (req, res) => {
  const { id } = req.params;

  res.render('singlenote');
});

/**
 * POST for 'note' page to recieve form data
 */

app.listen(3004);

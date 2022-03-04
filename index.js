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
 * POST for 'note' page to get form data
 */
app.post('/note', (req, res) => {
  // get data from form using req.body
  const formData = Object.values(req.body);
  const input = formData.map((data) => {
    // convert all form data to lower case
    const lower = data.toLowerCase();
    // convert 1st letter to upper
    return lower[0].toUpperCase() + lower.slice(1, lower.length);
  });
  const query =
    'INSERT INTO notes (date, time, day, behavior) VALUES($1, $2, $3, $4) ';

  pool.query(query, input, (err, result) => {
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
  const id = Number(req.params.id);
  // add 1 as SQL starts at index 1
  const input = [id + 1];
  console.log(input);
  const query = 'SELECT * FROM notes WHERE id=$1';

  // get relevant note data from url id
  pool.query(query, input, (err, result) => {
    if (err) {
      console.log('Error reading data', err);
      res.status(504).send('Read error, please contact server administrator.');
    }
    if (result.rows.length === 0) {
      res.status(403).send('Sorry, no data found.');
    }
    const data = result.rows[0];
    res.render('singlenote', { data });
  });
});

/**
 * POST for 'note' page to recieve form data
 */

app.listen(3004);

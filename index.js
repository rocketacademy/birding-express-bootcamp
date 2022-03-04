import pg from 'pg';
import methodOverride from 'method-override';
import express from 'express';

const app = express();

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// const PORT = process.argv[2];

// Initialise DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'gysiang',
  host: 'localhost',
  database: 'gysiang',
  port: 5432, // Postgres server always runs on this port by default
};
const pool = new Pool(pgConnectionConfigs);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// 1 /note GET route
app.get('/note', (request, response) => {
  response.render('form');
});

// 2 /note POST route

app.post('/note', (request, response) => {
  // add the data into the database
  const { flocksize } = request.body;
  // eslint-disable-next-line camelcase
  const { date_time } = request.body;
  const { behavior } = request.body;

  // eslint-disable-next-line camelcase
  const sqlQuery = `INSERT INTO notes (behavior, flocksize, date_time) VALUES ('${behavior}','${flocksize}', '${date_time}')`;

  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
    }
    console.log(result.rows);
    response.redirect('/');
  });
});

// 3 /note/:id GET route
app.get('/note/:id', (request, response) => {
  const sqlQuery = 'SELECT notes.id, notes.behavior, notes.flocksize, notes.date_time from notes';

  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      return;
    }
    console.log(request.params.id);
    const data = result.rows[request.params.id];
    console.log(data);

    response.render('viewNote', { data });
  });
});

// 4 / GET route, render a list of sightings
app.get('/', (request, response) => {
  const sqlQuery = 'SELECT * from notes';
  let data = {};
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing query', error);
      return;
    }
    data = {
      notes: result.rows,
    };
    console.log(data.notes[0].flocksize);
    response.render('index', { data });
  });
});

app.delete('/note/:id/delete', (request, response) => {
  const sqlQuery = `DELETE FROM notes WHERE id=${request.params.id}`;

  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      return;
    }
    response.redirect('/');
  });
});

app.listen(3004);

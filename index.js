import pg from 'pg';
import methodOverride from 'method-override';
import express from 'express';

const app = express();

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

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

// // 1 /note GET route
// app.get('/note', (req, res) => {
//   const getAllQuery = 'SELECT notes.id, notes.behavior, notes.flock_size';
//   pool.query(getAllQuery, (getAllQueryError, getAllQueryResult) => {
//     if (allQueryError) {
//       console.log('error', allQueryError);
//     } else {
//       console.log(getAllQueryResult.rows);
//       getAllNotes = getAllQueryResult.rows;
//     }
//   });
//   render('form', { getAllNotes });
// });

// // 2 /note POST route

// app.post('/note', (req, res) => {
//   // add the data into the database
//   const { flockSize } = req.body;
//   const { dateTime } = req.body;

//   const sqlQuery = `INSERT INTO notes (behavior, flock_size, date_time, user_id) VALUES ('${flockSize}', '${dateTime}')`;

//   pool.query(sqlQuery, (error, result) => {
//     if (error) {
//       console.log('Error executing query', error.stack);
//       return;
//     }
//     const data = result.rows[0];
//     data.flockSize = data.flock_size;
//     data.dateTime = data.date_time;
//   });
//   response.render('viewNote', { data });
// });

// 3 /note/:id GET route
// app.get('/note/:id', (req, res) => {
//   // load the info base on the id

//   response.redirect(`/note/${result.rows[0].id}`);
// });

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

app.listen(3004);

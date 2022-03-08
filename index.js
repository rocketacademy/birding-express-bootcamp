/* eslint-disable spaced-comment */
/* eslint-disable max-len */
import express, { urlencoded } from 'express';
import pg from 'pg';
import methodOverride from 'method-override';

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
// 2. species index / index edit / index del

// to use ejs
app.set('view engine', 'ejs');
// to use 'public' folder
app.use(express.static('public'));
// to use req.body for retrieving form data
app.use(urlencoded({ extended: false }));
// to use DEL or PUT
app.use(methodOverride('_method'));

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
    // sort sighting according to asc order
    // console.log(data);
    const sortQuery = req.query.sort;
    // BUG sorting by date / time (integers does not work)
    if (sortQuery) {
      data.sort((a, b) => {
        return a.day > b.day ? 1 : -1;
      });
    } else {
      data.sort((a, b) => {
        return a.id - b.id;
      });
    }
    res.render('index', { data });
  });
});

/**
 * GET for 'note' page to render a form
 */
app.get('/note', (req, res) => {
  // add query to db to get data
  const query = 'SELECT * FROM species';
  // get list of species and send to form.ejs
  pool.query(query, (err, result) => {
    if (err) {
      console.log('DB read error: ', err);
      res.status(404).send('Read Error.');
    }
    const data = result.rows;
    res.render('form', { data });
  });
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
    'INSERT INTO notes (date, time, day, species_id, flocksize, behavior) VALUES($1, $2, $3, $4, $5, $6) ';

  pool.query(query, input, (err, result) => {
    if (err) {
      console.log('Write error: ', err);
      res.status(504).send('Write error, please contact server administrator.');
    }
    console.log(result.rows);
  });
  res.send(
    'Thanks for your submission. Click <a href="/">here</a> to head back to the homepage'
  );
});

/**
 * GET for 'note' page to render a form
 */
app.get('/note/:id', (req, res) => {
  const id = Number(req.params.id);
  const input = [id];
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
 * GET for 'note/edit' page to edit data
 */
app.get('/note/:id/edit', (req, res) => {
  const id = Number(req.params.id);
  const input = [id];
  const query = 'SELECT * FROM notes WHERE id=$1';
  pool.query(query, input, (err, result) => {
    if (err) {
      console.log('Get error:', err);
      res.status(504).send('Get error.');
    }
    if (result.rows.length === 0) {
      res.status(404).send('No data found.');
    }
    const data = result.rows[0];
    res.render('singleEdit', { data });
  });
});

// BUG how to get the list of categories in the single edit ejs
// app.get('/note/:id/edit', (req, res) => {
//   const id = Number(req.params.id);
//   const input = [];
//   const query =
//     'select notes.id, notes.date, notes.time, notes.day, notes.behavior, notes.flocksize, notes.species_id, species.id AS species_table_id, species.name FROM notes INNER JOIN species ON notes.species_id = species.id;';
//   pool.query(query, input, (err, result) => {
//     if (err) {
//       console.log('Get error:', err);
//       res.status(504).send('Get error.');
//     }
//     if (result.rows.length === 0) {
//       res.status(404).send('No data found.');
//     }
//     const data = result.rows;
//     console.log(data);
//     res.render('singleEdit', { data, id });
//   });
// });

/**
 * PUT for 'note/edit' page to edit data
 */
app.put('/note/:id/', (req, res) => {
  const id = Number(req.params.id);
  const input = [
    req.body.date,
    req.body.time,
    req.body.day,
    req.body.behavior,
    req.body.flocksize,
    id,
  ];
  const query =
    'UPDATE notes SET date=$1, time=$2, day=$3, behavior=$4, flocksize=$5 WHERE id=$6';

  pool.query(query, input, (err, result) => {
    if (err) {
      console.log('Put error:', err);
      res.status(504).send('Put error.');
      return;
    }
    // console.log(result.rows);
    console.log('Successfully updated data.');
    res.status(200).redirect('/');
  });
});

/**
 * DEL for '/delete'
 */
app.delete('/note/:id', (req, res) => {
  const { id } = req.params;
  const input = [id];
  const query = 'DELETE FROM notes WHERE id = $1';

  pool.query(query, input, (err, result) => {
    if (err) {
      console.log('Delete error:', err);
      res.send(504).send('Delete error.');
      return;
    }
    console.log('Successfully deleted');
  });
});

/////////////
// SPECIES //
/////////////
/**
 * Get for species to render a form
 */
app.get('/species', (req, res) => {
  res.render('speciesGET');
});

/**
 * POST for species to add form data to DB
 */
app.post('/species', (req, res) => {
  // convert obj to array
  const data = Object.values(req.body);
  // convert form data to lower case
  const input = data.map((x) => {
    return x.toLowerCase();
  });
  const query = 'INSERT INTO species (name, scientific_name) VALUES ($1, $2)';
  pool.query(query, input, (err, result) => {
    if (err) {
      console.log('Write error:', err);
      res.status(504).send('Write error');
    }
    console.log('Write Successful');
    res.send(
      'Write Successful, click <a href="/">here</a> to head back to the homepage'
    );
  });
});

/**
 * GET for list of species
 */
app.get('/species/all', (req, res) => {
  const query = 'SELECT * FROM species';
  pool.query(query, (err, result) => {
    if (err) {
      console.log('Read error:', err);
      res.status(504).send('Read error');
    }
    if (result.rows.length === 0) {
      console.log('No data');
      return;
    }
    const data = result.rows;
    res.render('speciesAll', { data });
  });
});
app.listen(3004);

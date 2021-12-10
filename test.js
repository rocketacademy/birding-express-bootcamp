/* ================================================================== IMPORT MODULES = */
// express / server stuff
import express from 'express';
import methodOverride from 'method-override'; // npm install method-override
import moment from 'moment'; // npm install moment
import cookieParser from 'cookie-parser'; // npm install cookie-parser

// hashing
import jsSHA from 'jssha';

// postgres / database stuff
import pg from 'pg'; // npm install pg

/* ================================================================== DATABASE SET UP */
// Initialise the DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'eddiejpot',
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port by default
};
const pool = new Pool(pgConnectionConfigs);

/* ================================================================== EXPRESS AND EJS SET UP */
// Initialise Express
const app = express();
const PORT = 3004;

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

/* The code below allows us to listen for post requests
  *read more about it below
  *https://bootcamp.rocketacademy.co/3-backend-applications/3.1-express-js/3.1.3-handling-post-requests#receive-post-requests-in-express
*/
app.use(express.urlencoded({ extended: false }));

// EJS Set Up
app.set('view engine', 'ejs');
// allow access to public directory
app.use(express.static('public'));

/* ================================================================== COOKIES SET UP */
app.use(cookieParser());

/* ================================================================== USER LOGIN  */

let counter = 0;
// LOGIN
app.get('/login', (req, res) => {
  console.log(`In login route: ${counter}`);
  // render
  res.render('login');
  counter += 1;
});

// app.all('*', (req, res) => {
//   console.log('THIS RAN');
//   res.redirect('/login');
// });

/* ================================================================== LISTEN */
app.listen(PORT);

// Test if branch is working

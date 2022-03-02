import { render } from 'ejs';
import express from 'express';
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// 1 /note GET route
app.get('/note', (req, res) => {
  render('form')
});

// 2 /note POST route

app.post('/note', (req, res) => {
  // add the data into the database
})

// 3 /note/:id GET route
app.get('/note/:id', (req, res) => {
  // load the info base on the id
})

// 4 / GET route, render a list of sightings
app.post('/', (req,res) => {
  render('index')
})
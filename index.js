import express, { response } from 'express';
import pg from 'pg';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';

const { Pool } = pg;

const pgConnectionConfigs = {
  user: 'jyotikattani',
  host: 'localhost',
  database: 'birding',
  port: 5432,
};

const pool = new Pool(pgConnectionConfigs);

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/favicon.ico', express.static('images/flamingo.png'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride('_method'));

function createNewNote(req, res) {
  const speciesQuery = 'SELECT * FROM species';
  pool.query(speciesQuery, (err, result) => {
    if (err) {
      console.log(err);
      return err;
    }
    const speciesObjArr = result.rows;

    res.render('note', { speciesObjArr });
  });
}

function handleNotePostReq(req, res) {
  const formData = req.body;
  console.log(formData);
  console.log(typeof formData.date);
  console.log(`${formData.date},${formData.time},${formData.day},${formData.flock_size},${formData.habitat}`);
  const { date } = formData;
  const { time } = formData;
  const { day } = formData;
  const flockSize = formData.flock;
  console.log(`flock size ${flockSize}`);
  const { habitat } = formData;
  const { speciesId } = formData;

  const { behaviour } = formData;

  const notesInputData = `INSERT INTO notes (date, time, day, flock_size, habitat, species_id, behaviour) VALUES ('${date}', '${time}', '${day}', ${flockSize} , '${habitat}', '${speciesId}', '${behaviour}')`;

  pool.query(notesInputData, (err, result) => {
    if (err) {
      console.log(err);
      return err;
    }
    console.log(result);
    // res.send(result);
    res.redirect('/');
  });
}

function renderSingleNote(req, res) {
  console.log('render single note is running');
  const noteIndex = req.params.id;

  const singleNoteDate = `SELECT * FROM notes WHERE id = '${noteIndex}'`;
  pool.query(singleNoteDate, (err, result) => {
    if (err) {
      return err;
    }

    const singleNote = result.rows[0];
    // join notes and comments table.
    const joinQuery = `SELECT * FROM comments JOIN notes ON notes.id = comments.note_id WHERE note_id = ${noteIndex}`;
    pool.query(joinQuery, (err, joinResult) => {
      if (err) {
        console.log(`join table err: ${err}`);
      }
      const comments = joinResult.rows;
      console.log(joinResult);

      res.render('note-id', { singleNote, comments });
    });
  });
}

function renderListOfNotes(req, res) {
  const listOfNotes = 'SELECT * FROM notes';

  pool.query(listOfNotes, (err, result) => {
    if (err) {
      return err;
    }
    const allNotes = result.rows;
    console.log(allNotes);
    res.render('index', { allNotes });
  });
}

function signUpUser(req, res) {
  res.render('signup');
}

function handleUserSignUp(req, res) {
  const formInputData = req.body;
  const { email, password } = formInputData;

  const userSignupQuery = `INSERT INTO users (email, password) VALUES ('${email}', '${password}')`;
  pool.query(userSignupQuery, (err, result) => {
    if (err) {
      console.log(err);
      return err;
    }
    console.log(result);
  });
  res.render('signup-success');
}

function renderLoginForm(req, res) {
  res.render('login');
}
function handleUserLogin(req, res) {
  const inputEmail = req.body.email;
  const userQuery = `SELECT * FROM users WHERE email = '${inputEmail}'`;
  pool.query(userQuery, (err, result) => {
    if (err) {
      console.log(err);
      return err;
    }
    console.log(result);

    if (result.rows.length === 0) {
      response.status(403).send('Sorry!');
      return;
    }
    const user = result.rows[0];

    if (user.password === req.body.password) {
      res.cookie('loggedIn', true);
      res.cookie('userName', inputEmail);
      // res.send('successfully logged in!');
      res.render('login-success');
    }
    else {
      res.status(403).send('Sorry!');
    }
  });
}

function checkUserLoginStatus(req, res) {
  if (req.cookies.loggedIn === undefined) {
    // res.status(403).send('Sorry, please log in!');
    res.status(403);
    res.render('login');
    return;
  }
  res.render('user-dashboard');
}

function logOutUser(req, res) {
  res.clearCookie('loggedIn');
  res.render('logout-success');
}

function renderCreateSpeciesForm(req, res) {
  res.render('species');
}

function handleSpeciesPostReq(req, res) {
  const speciesName = req.body.species_name;
  const speciesScientificName = req.body.scientific_name;

  const speciesQuery = `INSERT INTO species (name, scientific_name) VALUES ('${speciesName}', '${speciesScientificName}')`;

  pool.query(speciesQuery, (err, result) => {
    if (err) {
      console.log(err);
      return err;
    }
    console.log(result);
  });
  res.send('working on it');
}

function renderSingleSpecies(req, res) {
  const id = req.params.index;
  const singleSpeciesQuery = `SELECT * FROM species WHERE id = '${id}'`;
  pool.query(singleSpeciesQuery, (err, result) => {
    if (err) {
      console.log(err);
      return err;
    }
    console.log(result.rows);
    const notesSpeciesQuery = `SELECT notes.habitat, notes.flock_size, notes.date, notes.time, notes.day, notes.behaviour, species.name, species.scientific_name FROM notes INNER JOIN species ON species.id= notes.species_id WHERE species_id = '${id}'`;

    pool.query(notesSpeciesQuery, (innerJoinErr, innerJoinResult) => {
      if (innerJoinErr) {
        console.log(innerJoinErr);
        return innerJoinErr;
      }
      console.log(innerJoinResult.rows);
      const species = innerJoinResult.rows;
      res.render('species-index', { species });
    });
  });
}

function renderAllSpecies(req, res) {
  const speciesQuery = 'SELECT * FROM species';
  pool.query(speciesQuery, (err, result) => {
    if (err) {
      console.log(err);
      return err;
    }
    const speciesObjArr = result.rows;
    console.log(speciesObjArr);
    res.render('species-all', { speciesObjArr });
  });
}

function editSpecies(req, res) {
  const id = req.params.index;
  const speciesQuery = `SELECT * FROM species WHERE id = '${id}'`;
  pool.query(speciesQuery, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    const speciesToEdit = result.rows[0];
    res.render('species-edit', { speciesToEdit });
  });
}

function speciesEditData(req, res) {
  const { speciesId, speciesName, scientificName } = req.body;
  const speciesQuery = `UPDATE species SET name = '${speciesName}', scientific_name = '${scientificName}' WHERE id ='${speciesId}'`;
  pool.query(speciesQuery, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(result);
    res.redirect(`/species/${speciesId}`);
  });
}

function deleteSpecies(req, res) {
  const deleteSpeciesId = req.params.index;
  const speciesQuery = `DELETE FROM species WHERE id = '${deleteSpeciesId}'`;
  pool.query(speciesQuery, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(result);
    res.redirect('/species/all');
  });
}

function handleComments(req, res) {
  const { id } = req.params;
  const { comment } = req.body;
  const postedBy = req.cookies.userName;
  const query = `INSERT INTO comments (comment_text, note_id,posted_by) VALUES ('${comment}', '${id}', '${postedBy}')`;
  pool.query(query, (err, result) => {
    if (err) {
      console.log(`insert err${err}`);
      return;
    }
    console.log(`insert success in comments table ${result}`);
    res.redirect('/');
  });
}
// get routes
// renders a form which creates a new note.
app.get('/note', createNewNote);
app.get('/note/:id', renderSingleNote);

app.get('/', renderListOfNotes);
// render a form that will sign up a user.
app.get('/signup', signUpUser);
// render a form that will log a user in.
app.get('/login', renderLoginForm);
// user need to be authenticated to view the dashboard;
app.get('/user-dashboard', checkUserLoginStatus);
// render a form that will create a new species
app.get('/species', renderCreateSpeciesForm);
app.get('/species/all', renderAllSpecies);
// render a single species. This has a list of all notes with this species.
app.get('/species/:index', renderSingleSpecies);
// render a form to edit a species
app.get('/species/:index/edit', editSpecies);

// post route
app.post('/note', handleNotePostReq);
app.post('/signup', handleUserSignUp);
app.post('/login', handleUserLogin);
// accept a post request to create a new species
app.post('/species', handleSpeciesPostReq);
app.post('/note/:id/comment', handleComments);

app.put('/species/:index/edit', speciesEditData);
app.delete('/logout', logOutUser);
app.delete('/species/:index/delete', deleteSpecies);

let PORT = '';
if (process.argv[2] === '80') {
  PORT = 80;
}
else {
  PORT = 3004;
}
app.listen(3004, () => {
  console.log(`server started at: ${PORT}`);
});

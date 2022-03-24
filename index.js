/* eslint-disable comma-dangle */
/* eslint-disable operator-linebreak */
/* eslint-disable arrow-body-style */
/* eslint-disable spaced-comment */
/* eslint-disable max-len */
import express, { urlencoded } from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import jsSHA from 'jssha';
import { upperCaseFirstLetter } from './helperFunctions.js';

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
// 2. Edit singlenote ejs to use latest behavior

// to use ejs
app.set('view engine', 'ejs');
// to use 'public' folder
app.use(express.static('public'));
// to use req.body for retrieving form data
app.use(urlencoded({ extended: false }));
// to use DEL or PUT
app.use(methodOverride('_method'));
// to parse cooking string from req into an obj
app.use(cookieParser());

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
  // check if user is logged in
  if (req.cookies.userId === undefined) {
    res.status(403).redirect('/login');
    return;
  }
  // add query to db to get data
  const query = 'SELECT * FROM species';
  // get list of species and send to form.ejs
  pool.query(query, (err, result) => {
    if (err) {
      console.log('DB read error: ', err);
      res.status(404).send('Read Error.');
      return;
    }
    const species = result.rows;
    const queryBehavior = 'SELECT * FROM behaviors';
    // get list of behaviors from table and add into form
    pool.query(queryBehavior, (err, behaviorResult) => {
      if (err) {
        console.log('DB read error: ', err);
        res.status(404).send('Read Error.');
        return;
      }
      const behaviors = behaviorResult.rows;
      res.render('form', { species, behaviors });
    });
  });
});

/**
 * POST for 'note' page to get form data
 */
app.post('/note', (req, res) => {
  // get data from form using req.body
  // const formData = Object.values(req.body);
  const data = req.body;
  const formData = [
    data.date,
    data.time,
    data.day,
    data.species_id,
    data.flocksize,
  ];
  // retrieve userId from cookie
  const { userId } = req.cookies;

  // add userId into input
  formData.push(userId);

  const query =
    'INSERT INTO notes (date, time, day, species_id, flocksize, user_created) VALUES($1, $2, $3, $4, $5, $6) RETURNING *';

  pool.query(query, formData, (err, result) => {
    if (err) {
      console.log('Write error: ', err);
      res.status(504).send('Write error, please contact server administrator.');
      return;
    }
    console.log(result.rows[0]);
    const noteId = result.rows[0].id;
    const behaviorquery =
      'INSERT INTO note_behaviors (note_id, behavior_id) VALUES ($1, $2)';
    // loop over each behavior recorded
    let queryCounter = 0;
    req.body.behavior_id.forEach((behavior) => {
      const note_behaviorsValues = [noteId, behavior];
      pool.query(behaviorquery, note_behaviorsValues, (err, result) => {
        if (err) {
          console.log('Write error: ', err);
          res
            .status(504)
            .send('Write error, please contact server administrator.');
          return;
        }
        queryCounter += 1;
        if (queryCounter === req.body.behavior_id.length) {
          res.send(
            'Thanks for your submission. Click <a href="/">here</a> to head back to the homepage'
          );
        }
      });
    });
  });
});

/**
 * GET for 'note' page to render a form
 */
app.get('/note/:id', (req, res) => {
  // check if user is logged in (for use in ejs)
  const { userId } = req.cookies;
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

    // 2nd query to get user email from another table
    const input2 = [data.user_created];
    const query2 = 'SELECT * FROM users WHERE id=$1';
    pool.query(query2, input2, (err, result) => {
      if (err) {
        console.log('Read error query 2', err);
        res.status(504).send('Server error.');
      }
      const user = result.rows[0];

      // 3rd query to get behavior names

      const behaviorQuery =
        'SELECT behaviors.id, behaviors.behavior, note_behaviors.note_id FROM behaviors INNER JOIN note_behaviors ON behaviors.id = note_behaviors.behavior_id WHERE note_behaviors.note_id = $1';
      pool.query(behaviorQuery, input, (err, result) => {
        if (err) {
          console.log('Read error query 2', err);
          res.status(504).send('Server error.');
        }
        const behaviors = result.rows;
        // console.log(behaviors);
        const commentsQuery =
          'SELECT comments.note_id, comments.sighting_comments, users.email FROM comments INNER JOIN users ON comments.user_commented = users.id  WHERE comments.note_id = $1';
        pool.query(commentsQuery, input, (err, result) => {
          if (err) {
            console.log('Read error comments query', err);
            res.status(504).send('Server error.');
          }
          const comments = result.rows;
          // console.log(comments);
          res.render('singlenote', { data, user, behaviors, comments, userId });
        });
      });
    });
  });
});

/**
 * GET for 'note/edit' page to edit data
 */
app.get('/note/:id/edit', (req, res) => {
  // redirect to main page if user is not logged in
  if (!req.cookies.userId) {
    res.redirect('/');
  } else {
    // retrieve current userId
    const userInsert = [req.cookies.userId];
    // check against his created forms
    const userQuery = 'SELECT * FROM notes WHERE user_created=$1';
    pool.query(userQuery, userInsert, (err, result) => {
      if (err) {
        console.log('User read error', err);
        res.status(504).send('User read error.');
      }
      // add edit button only for his created forms
      const usersCreatedFormId = result.rows.map((user) => {
        return user.id;
      });
      const id = Number(req.params.id);
      const input = [id];
      // check if user created form is same as what user clicked in GET
      if (usersCreatedFormId.indexOf(id) !== -1) {
        const query = 'SELECT * FROM notes WHERE id=$1';
        pool.query(query, input, (err, result) => {
          if (err) {
            console.log('Get error:', err);
            res.status(504).send('Get error.');
            return;
          }
          if (result.rows.length === 0) {
            res.status(404).send('No data found.');
          }
          const data = result.rows[0];
          const queryBehavior =
            'SELECT note_behaviors.note_id, behaviors.id, behaviors.behavior FROM note_behaviors INNER JOIN behaviors ON note_behaviors.behavior_id = behaviors.id WHERE note_behaviors.note_id = $1';
          pool.query(queryBehavior, input, (err, result) => {
            if (err) {
              console.log('Get error:', err);
              res.status(504).send('Get error.');
              return;
            }
            const behavior = result.rows;
            data.behavior = behavior;
            const queryBehaviorList = 'SELECT * FROM behaviors';
            const behaviorIds = result.rows.map((x) => {
              return x.id;
            });
            pool.query(queryBehaviorList, (err, result) => {
              if (err) {
                console.log('Get error:', err);
                res.status(504).send('Get error.');
                return;
              }
              const behaviorList = result.rows;
              res.render('singleEdit', { data, behaviorList, behaviorIds });
            });
          });
        });
      } else {
        res.redirect('/');
      }
    });
  }
});

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
      res.status(504).send('Delete error.');
      return;
    }
    const queryDelNoteBehaviors =
      'DELETE FROM note_behaviors WHERE note_id = $1';
    pool.query(queryDelNoteBehaviors, input, (err, results) => {
      if (err) {
        console.log('Delete error:', err);
        res.status(504).send('Delete error.');
        return;
      }
      console.log('Successfully deleted');
      res.redirect('/');
    });
  });
});

/**
 * GET for user own list of notes
 */
app.get('/users/', (req, res) => {
  if (!req.cookies.userId) {
    res.redirect('/login');
  } else {
    const { userId } = req.cookies;
    const input = [userId];
    const query = 'SELECT * FROM notes WHERE user_created = $1';
    pool.query(query, input, (err, result) => {
      if (err) {
        console.log('DB retrieval error', err);
        res.status(504).send('DB retrieval error');
        return;
      }
      const data = result.rows;
      // console.log(data);
      res.render('singleUserGET', { data });
    });
  }
});

/////////////
// Signup ///
/////////////
/**
 * GET for signup to render a form
 */
app.get('/signup', (req, res) => {
  res.render('signupGET');
});

/**
 * POST to add user credentials to DB
 */
app.post('/signup', (req, res) => {
  const data = req.body;
  // init the SHA obj
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  // input pass from req to SHA object
  shaObj.update(data.password);
  // get hashed password
  const hashedPassword = shaObj.getHash('HEX');
  const insert = [req.body.email.toLowerCase(), hashedPassword];
  console.log(insert);
  const query = 'INSERT INTO users (email, password) VALUES ($1, $2)';
  pool.query(query, insert, (err, results) => {
    if (err) {
      console.log('Write error:', err);
      res.status(504).send('Write error');
      return;
    }
    console.log('User added successfully.');
    res.send(
      'User added successfully, click <a href="/">here</a> to head back to the homepage'
    );
  });
});

/////////////
/// Login ///
/////////////
/**
 * GET for signup to render a form
 */
app.get('/login', (req, res) => {
  if (req.cookies.userId) {
    res.redirect('/');
  } else {
    res.render('loginGET');
  }
});

/**
 * POST to check user credentials for login
 */
app.post('/login', (req, res) => {
  const data = req.body;
  const salt = 'this will hash';
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(data.password);
  const hashedPassword = shaObj.getHash('HEX');
  const insert = [req.body.email.toLowerCase()];
  const query = 'SELECT * FROM users WHERE email = $1';
  pool.query(query, insert, (err, result) => {
    if (err) {
      console.log('Read error:', err);
      res.status(503).send('Read error');
      return;
    }
    if (result.rows.length === 0) {
      console.log('Email is wrong.');
      res.status(403).send('Sorry user/pass is wrong.');
      return;
    }
    const user = result.rows[0];
    if (user.password === hashedPassword) {
      const shaObj2 = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      const unhashedCookieString = `${user.email}-${salt}`;
      shaObj2.update(unhashedCookieString);
      const hashedUserId = shaObj2.getHash('HEX');
      res.cookie('userId', user.id);
      res.cookie('loggedInHash', hashedUserId);
      res.send(
        'Logged in. Click <a href="/">here</a> to head back to the homepage'
      );
    } else {
      res.status(403).send('Sorry user/pass is wrong.');
    }
  });
});

/////////////
/// Logout ///
/////////////
app.get('/logout', (req, res) => {
  res.clearCookie('userId');
  res.clearCookie('loggedInHash');
  res.send(
    'Successfully logged out, Click <a href="/">here</a> to head back to the homepage'
  );
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
      return;
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
      return;
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

/**
 * GET to render a single species that lists all notes with the particular species
 */
app.get('/species/:id', (req, res) => {
  const { id } = req.params;
  const input = [id];
  const speciesQuery = 'SELECT * FROM notes WHERE species_id = $1';
  pool.query(speciesQuery, input, (err, result) => {
    if (err) {
      console.log('Read error', err);
      res.status(504).send('Read error.');
      return;
    }
    const data = result.rows;
    res.render('speciesSingleGET', { data });
  });
});

/**
 * GET to render edit form for single species
 */
app.get('/species/:id/edit', (req, res) => {
  const { id } = req.params;
  const input = [id];
  const query = 'SELECT * FROM species WHERE id = $1';
  pool.query(query, input, (err, result) => {
    if (err) {
      console.log('Read error', err);
      res.status(504).send('Read error.');
      return;
    }
    const data = result.rows[0];
    res.render('speciesEditSingle', { data });
  });
});

/**
 * PUT to edit a single species
 */
app.put('/species/:id/edit', (req, res) => {
  const { id } = req.params;
  const input = [req.body.name, req.body.scientific_name, id];
  const query =
    'UPDATE species SET name=$1, scientific_name = $2 WHERE id = $3 ';
  pool.query(query, input, (err, result) => {
    if (err) {
      console.log('Write error', err);
      res.status(504).send('Write error.');
      return;
    }
    console.log('Updated successfully!');
    res.redirect('/species/all');
  });
});

/**
 * DEL to del a species
 */
app.delete('/species/:id/delete', (req, res) => {
  const { id } = req.params;
  const input = [id];
  const query = 'DELETE FROM species WHERE id = $1';
  pool.query(query, input, (err, result) => {
    if (err) {
      console.log('Delete error', err);
      res.status(504).send('Delete error.');
      return;
    }
    console.log('Successfully deleted');
    res.redirect('/species/all');
  });
});

//////////////
// BEHAVIOR //
//////////////

/**
 * GET to render a list of behaviors
 */
app.get('/behaviors', (req, res) => {
  const behaviorsQuery = 'SELECT * FROM behaviors';
  pool.query(behaviorsQuery, (err, result) => {
    if (err) {
      console.log('Read error', err);
      res.status(504).send('Read error.');
      return;
    }
    const listOfBehaviors = result.rows;
    res.render('behaviorsAll', { listOfBehaviors });
  });
});

/**
 * GET to render a behavior with all list of notes associated with the behavior
 */

app.get('/behaviors/:id', (req, res) => {
  const { id } = req.params;
  const input = [id];
  // get id of notes that correspond to behavior id
  const noteQuery =
    'SELECT notes.id, notes.date, notes.time, notes.day FROM notes INNER JOIN note_behaviors ON notes.id = note_behaviors.note_id WHERE note_behaviors.behavior_id = $1';

  pool.query(noteQuery, input, (err, result) => {
    if (err) {
      console.log('Read error', err);
      res.status(504).send('Read error.');
      return;
    }
    const noteData = result.rows;

    res.render('behaviorsSINGLE', { noteData });
  });
});

//////////////
// COMMENTS //
//////////////

app.post('/note/:id/comment', (req, res) => {
  const { userId } = req.cookies;
  const noteId = Number(req.params.id);
  // get user comments from form
  const userComments = req.body.comments;
  const insert = [noteId, userComments, userId];
  // add userComments into comments table
  const addCommentsQuery =
    'INSERT INTO comments (note_id, sighting_comments, user_commented) VALUES($1, $2, $3)';
  // console.log(insert);
  pool.query(addCommentsQuery, insert, (err, result) => {
    if (err) {
      console.log('Write error', err);
      res.status(504).send('Write error');
      return;
    }
    res.redirect('/');
  });
});

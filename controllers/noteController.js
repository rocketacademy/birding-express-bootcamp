// import poolQueries from '../models/dbQuery.js';
import pool from '../models/dbConfig.js';

// DISPLAYS ALL NOTES
export const allNotesController = (req, res) => {
  // poolQueries(query, (err, results) => {
  //   if (err) {
  //     console.log(`ERROR FROM allNotesController ${err}`);
  //     return;
  //   }
  //   const data = results;
  //   console.log(`THIS IS FROM allNotesController -->> ${data.rows}`);
  //   res.status(200).render('noteViews/allNotes',
  //     {
  //       title: 'All Notes',
  //       instructions: 'Display all notes here',
  //       data: data.rows,
  //     });
  // });

  pool.query('select * from notes', (err, results) => {
    if (err) {
      console.log(`ERROR FROM allNotesController -->> ${err}`);
    } else {
      console.log(`SUCCESS QUERY FROM allNotesController -->> ${results}`);
      res.status(200).render('noteViews/allNotes',
        {
          title: 'All Notes',
          instructions: 'Display all notes here',
          data: results.rows,
          user_id: req.cookies.user_id,
        });
    }
  });
};

// NEW NOTE FORM
export const createNoteController = (req, res) => {
  if (!req.cookies.user_id) {
    res.status(403).redirect('http://localhost:3000/login');
  }
  res.status(200).render('homeViews/createNote', { user_id: req.cookies.user_id });
};

// FORM POST CONTROLLER
export const postNoteController = async (req, res) => {
  const {
    // eslint-disable-next-line camelcase
    habitat, behaviour, flock_size, date,
  } = req.body;
  const user = req.cookies.user_id;
  // eslint-disable-next-line camelcase
  const values = [habitat, behaviour, flock_size, date, user];

  // poolQueries(query, values, (err, result) => {
  //   if (err) {
  //     console.log(`ERROR IN CONTROLLER postNoteController ${err}`);
  //   }
  //   data = result;

  //   // REDIRECT TO A SINGLE PAGE
  //   console.log(data.id);
  //   console.log(data);

  //   res.redirect('/note/all');
  // });

  // TRIED ASYNC AWAIT BUT STILL SAME ERR

  const { rows } = await pool.query('INSERT INTO notes (habitat,behaviour,flock_size,date, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', values);
  console.log(rows);
  res.redirect('/profile');
  // res.status(200).render('noteViews/singleNote',
  //   {
  //     title: 'Single Note',
  //     instructions: 'To render a single note here',
  //     data: rows,
  //   });
};

// DISPLAYS SINGLE NOTE
export const singleNoteController = async (req, res) => {
  const { id } = req.params;
  console.log(`FROM singleNoteController ID -->> ${req.params.id}`);

  // ERROR IS THAT PG IS QUERYING X2 AND THE SECOND TIME WITH ID=INDEX.JS

  // TRIED QUERYING THORUG A FN BUT STILL SAME
  // poolQueries(sqlQuery, [id], (err, results) => {
  //   if (err) {
  //     console.log(`ERROR FROM singleNoteController -->> ${err}`);
  //     return;
  //   }
  //   console.log(`THIS IS FROM singleNoteController -->> ${results}`);
  //   res.status(200).render('noteViews/singleNote',
  //     {
  //       title: 'Single Note',
  //       instructions: 'To render a single note here',
  //       data: results,
  //     });

  //   console.log(`ERROR FROM singleNoteController -->> ${err}`);
  // });

  // TRIED ASYNC AWAIT BUT STILL SAME ERR
  const { rows } = await pool.query('select * from notes where id=$1', [id]);
  console.log(rows);
  res.status(200).render('noteViews/singleNote',
    {
      title: 'Single Note',
      instructions: 'To render a single note here',
      data: rows,
      user_id: req.cookies.user_id,
    });
};

export const editNoteController = async (req, res) => {
  const { id } = req.params;
  console.log(req.body);
  const sqlQuery = 'SELECT * FROM notes WHERE id=$1';
  console.log(sqlQuery);

  // poolQueries(sqlQuery, [50], (err, results) => {
  //   if (!err) {
  //     console.log(`SUCCESS FROM editNoteController -->> ${results}`);

  //     res.status(200).render('noteViews/editNote', { data: results });
  //     return;
  //   }
  //   console.log(`ERROR FROM editNoteController -->> ${err}`);
  // });
  const { rows } = await pool.query('select * from notes where id=$1', [id]);
  console.log(`this is id -->> ${id}`);
  console.log(rows);

  res.render('noteViews/editNote', {
    data: rows,
    user_id: req.cookies.user_id,
  });
};

export const postEditNoteController = (req, res) => {
  // update row via id
  const { id } = req.params;
  const {
    // eslint-disable-next-line camelcase
    habitat, behaviour, date, flock_size,
  } = req.body;

  // eslint-disable-next-line camelcase
  pool.query(`UPDATE notes SET habitat = '${habitat}', behaviour = '${behaviour}', date = '${date}', flock_size = '${flock_size}' WHERE id=${id} RETURNING *`, (err, results) => {
    if (err) {
      console.log(`ERROR FROM postEditNoteController -->> ${err}`);
    } else {
      console.log(results.rows);
      res.redirect('/profile');
    }
  });
};

export const deleteNoteController = (req, res) => {
  const { id } = req.params;

  pool.query(`SELECT * FROM notes WHERE id=${id}`, (err, results) => {
    if (err) {
      console.log(`ERROR FROM deleteNoteController -->> ${err}`);
    } else {
      res.render('noteViews/confirmDelete', {
        data: results.rows,
      });
    }
  });
};

export const confirmDelete = (req, res) => {
  const { id } = req.params;
  // eslint-disable-next-line no-unused-vars
  pool.query(`DELETE FROM notes WHERE id=${id} RETURNING *`, (err, results) => {
    if (err) {
      console.log(`ERROR FROM confirmDelete -->> ${err}`);
    } else {
      res.redirect('/profile');
    }
  });
};

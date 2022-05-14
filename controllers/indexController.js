import jsSHA from 'jssha';
import pool from '../models/dbConfig.js';

export const homeController = (req, res) => {
  res.status(200).render('homeViews/home', {
    title: 'Bird Watching',
    page: 'home',
    desc: 'This is the home page where is set up a welcome page with links to other home pages',
    user_id: req.cookies.user_id,

  });
};
export const aboutController = (req, res) => {
  res.status(200).render('homeViews/home', {
    title: 'Bird Watching',
    page: 'about',
    desc: 'This is the about page where is set up a welcome page with links to other home pages',
    user_id: req.cookies.user_id,

  });
};

export const loginController = (req, res) => {
  res.status(200).render('homeViews/login',
    {
      title: 'Login',
      user_id: req.cookies.user_id,
    });
};
export const signUpController = (req, res) => {
  res.status(200).render('homeViews/signUp',
    {
      title: 'Sign Up',
      user_id: req.cookies.user_id,
    });
};

export const postLoginController = (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  // Check db for user
  pool.query(`SELECT * FROM users WHERE email='${userEmail}'`, (dbErr, results) => {
    if (dbErr) {
      console.log(`ERROR FROM postLoginController -->> ${dbErr}`);
      // res.status(403).redirect('/signUp',
      //   {
      //     title: 'Sign Up',
      //     errMsg: 'Create A New Account',
      //   });
    }
    if (results.rows.length === 0) {
      // res.redirect('/signUp');
      res.render('homeViews/signUp', { title: 'Sign Up', errMsg: 'We could not find you. Create a new account!' });
    } else {
      const { id, password, email } = results.rows[0];
      // Hash and salt
      // eslint-disable-next-line new-cap
      const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      shaObj.update(userPassword);
      const hash = shaObj.getHash('HEX');
      if (password === hash) {
        res.cookie('user_id', id);
        res.cookie('user_email', email);
        res.redirect('/profile');
      } else {
        res.redirect('/signUp');
      }
    }
  });
  // If no user redirect to sign up
};

export const postSignUpController = async (req, res) => {
  const userPassword = req.body.password;
  const userEmail = req.body.email;

  // Hash and salt
  // eslint-disable-next-line new-cap
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(userPassword);
  const hash = shaObj.getHash('HEX');

  // check if user exists
  const { rows } = await pool.query(`SELECT * FROM users WHERE email='${userEmail}'`);
  if (rows.length > 0) {
    res.render('homeViews/signUp',
      {
        title: 'Sign Up',
        errMsg: 'Sorry! User already exists!',
      });
  } else {
    pool.query(`INSERT INTO users(email, password) VALUES ('${userEmail}', '${hash}') RETURNING *`, (err, results) => {
      if (err) {
        console.log(`ERROR FROM postSignUpController -->> ${err}`);
      }
      console.log(`here -->> ${results}`);
      res.cookie('user', 'zaffere');
      res.redirect('/profile');
    });
  }
  // save user then redirect to home
};

export const profileController = async (req, res) => {
  // eslint-disable-next-line camelcase
  const { user_id } = req.cookies;
  // eslint-disable-next-line camelcase
  const { rows } = await pool.query(`SELECT * FROM notes WHERE user_id=${user_id}`);

  res.render('user/userProfile', {
    title: 'Profile',
    user_id: req.cookies.user_id,
    user_email: req.cookies.user_email,
    notes: rows,

  });
};

export const postLogoutController = (req, res) => {
  res.clearCookie('user_id');
  res.clearCookie('user_email');
  res.redirect('/');
};

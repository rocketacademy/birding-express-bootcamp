import express from 'express';
import methodOverride from 'method-override';
import moment from 'moment';
import cookieParser from 'cookie-parser';
import root from './routes/root.js';
import note from './routes/note.js';
import users from './routes/users.js';
import signup from './routes/signup.js';
import login from './routes/login.js';
import logout from './routes/logout.js';
import species from './routes/species.js';

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

app.use((req, res, next) => {
  res.locals.user = req.cookies.user;
  next();
});

app.set('view engine', 'ejs');

moment().format();
moment.suppressDeprecationWarnings = true;

app.use('/', root);
app.use('/note', note);
app.use('/users', users);
app.use('/signup', signup);
app.use('/login', login);
app.use('/logout', logout);
app.use('/species', species);

// start the server listening for requests
app.listen(process.env.PORT || 3004, () => console.log('Server is running...'));

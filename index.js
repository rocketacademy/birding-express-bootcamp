/* eslint-disable no-underscore-dangle */
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import pg from 'pg';
import {} from 'dotenv/config';

// APP ROUTERS
import indexRouter from './routes/indexRouter.js';
import noteRouter from './routes/noteRouter.js';

const __dirname = path.resolve('.');

// INITIALISING THE SERVER
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/note', noteRouter);

app.listen(process.env.PORT, () => console.log(`LISTENING ON http://localhost:${process.env.PORT}`));

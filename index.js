/* eslint-disable no-underscore-dangle */
import express from 'express';
import cookieParser from 'cookie-parser';

import {} from 'dotenv/config';

// APP ROUTERS
import indexRouter from './routes/indexRouter.js';
import noteRouter from './routes/noteRouter.js';

// INITIALISING THE SERVER
const app = express();

app.use(cookieParser());
app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));
app.set('views', './views');
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/note', noteRouter);

app.listen(process.env.PORT, () => console.log(`LISTENING ON http://localhost:${process.env.PORT}`));

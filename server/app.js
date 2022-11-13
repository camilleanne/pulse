import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import indexRouter from './routes/index';
import splashRouter from './routes/splash';
var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public/')));


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '../public/splash.html'));
  });
  
app.get('/begin', function(req, res) {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

app.use('/index', indexRouter);
app.use('/splash', splashRouter);

export default app;

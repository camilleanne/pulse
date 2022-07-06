import express from 'express';
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('splash', { title: 'Splash' });
});

export default router;

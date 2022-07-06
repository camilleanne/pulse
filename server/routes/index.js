import express from 'express';
var router = express.Router();

router.get('/begin', function(req, res, next) {
  res.render('index', { title: 'Index' });
});

export default router;

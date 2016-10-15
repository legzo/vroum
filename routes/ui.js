var express = require('express');
var router = express.Router();
var api = require('./api');

/* GET users listing. */
router.get('/', function(req, res) {

  let cars = [1, 2, 3].map(v => 'Car #' + v);
  res.render('cars', { title: 'Cars', cars: cars });

});

module.exports = router;

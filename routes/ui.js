var express = require('express');
var router = express.Router();
var api = require('./api');

var crawler = require('./crawler');

/* GET users listing. */
router.get('/', function(req, res) {

  var results = [];

  var p1 = crawler.getCar('62108859')
    .then((result) =>  results.push(result));
  
  var p2 = crawler.getCar('62034997')
    .then((result) =>  results.push(result));
  
  Promise.all([p1, p2])
    .then(function() {
      res.render('cars', { title: 'Cars', cars: results });
    })
    .catch(() => console.log('error :/'));

  

});

module.exports = router;

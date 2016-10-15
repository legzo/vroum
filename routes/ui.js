var express = require('express');
var router = express.Router();
var api = require('./api');
var perfy = require('perfy');

var logger = require('./logger');
var crawler = require('./crawler');

/* GET users listing. */
router.get('/', function(req, res) {

  var results = [];
  var queries = [];

  crawler.getCars({brand: 'Skoda', model: 'superb'})
    .then(function(data) {
      for (let i = 0; i < data.cars.length; i++) {
        queries.push(crawler.getCar(data.cars[i].id)
                            .then((result) =>  results.push(result)));
      }

      perfy.start('all-cars');
      
      Promise.all(queries)
             .then(function() {
               let elapsed = perfy.end('all-cars');
               logger.info(`All done in ${elapsed.time}`);
               res.render('cars', { title: 'Cars', cars: results });
             })
            .catch(() => logger.error('error :/'));
    });

});

module.exports = router;

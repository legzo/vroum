let express = require('express');
let router = express.Router();
let request = require('request');
var rp = require('request-promise');
let cheerio = require('cheerio');
let colors = require('colors');
var perfy = require('perfy');

var crawler = require('./crawler');


router.get('/cars', function(req, res) {

  let params = req.query;

  crawler.getCars(params)
    .then((result) =>  res.json(result));

});


router.get('/cars/:id', function(req, res) {

  let id = req.params.id;

  crawler.getCar(id)
    .then((result) =>  res.json(result));

});


module.exports = router;

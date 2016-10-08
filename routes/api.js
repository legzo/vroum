let express = require('express');
let router = express.Router();
let request = require('request');
var rp = require('request-promise');
let cheerio = require('cheerio');
let colors = require('colors');
var perfy = require('perfy');

const ROOT_URL = 'http://www.lacentrale.fr';
const DEFAULT_MAX_RESULTS = 30;
const DEFAULT_BRAND = 'SKODA';

router.get('/cars', function(req, res) {

  perfy.start('request');

  let result = {};

  rp(getSearchParams(req))
    .then(function(body) {
      console.log('search OK'.green);
      let result = getResultsFromResponse(body);
      res.json(result);
    })
    .catch(function (err) {
      console.log('search KO'.red);
      result = { msg : 'error occured :/'};
      res.json(result);
    });    
});

let getResultsFromResponse = function(body) {
      const $ = cheerio.load(body);

      const cars = $('a.ann');
      let foundCars = [];

      for (let i = 0; i < cars.length; i++) {
        let car = cars[i];
        let foundCar = {};
        
        foundCar.url = getCarUrl(car.attribs['href']);
        foundCar.name = getCarName($, $(car));
        foundCar.imageUrl = getCarImageUrl($, $(car));
        foundCar.location = getNumericField($, $(car), '.pictoFrance');
        foundCar.year = getNumericField($, $(car), '.fieldYear');
        foundCar.mileage = getNumericField($, $(car), '.fieldMileage', 'km');
        foundCar.price = getNumericField($, $(car), '.fieldPrice', '€');

        foundCars.push(foundCar);
      }

      const minPrice = Math.min(...foundCars.map(car => car.price));
      const maxPrice = Math.max(...foundCars.map(car => car.price));

      let cheapCars = foundCars.filter(car => car.price === minPrice);
      let expensiveCars = foundCars.filter(car => car.price === maxPrice);

      var elapsed = perfy.end('request');

      result = {
        infos : {
          elapsed : elapsed.time,
          results : foundCars.length,
          maxPrice : maxPrice,
          minPrice : minPrice,
          cheapest : cheapCars,
          mostExpensive : expensiveCars
        },
        cars : foundCars
      };

      return result;
}

let getNumericField = function($, subNode, selector, patternToRemove) {
  let fieldValue = subNode.find($(selector)).first().text();
  if(patternToRemove) {
    fieldValue = fieldValue.replace(patternToRemove, '');
  }

  return parseInt(fieldValue.replace(/\s/g, ""), 10);
}

let getCarName = function($, carNode) {
  let name = '';

  carNode.find($('h3 span')).each(function(i, elem) {
    let text = $(this).text();
    name += $(this).text().trim();
    name += ' ';
  });

  return name;
}

let getCarUrl = function(endOfUrl) {
  return `${ROOT_URL}${endOfUrl}`;
}

let getCarImageUrl = function($, carNode) {
  let imageUrl = carNode.find($('.imgContent>img')).first().attr('src')
  return imageUrl.replace('-minivign', '');
}

let getSearchParams = function(req) {
  let brand = req.query.brand;
  let model = req.query.model;
  let maxResults = req.query.maxResults;

  if(!maxResults) {
    maxResults = DEFAULT_MAX_RESULTS;
  }

  if(!brand) {
    brand = DEFAULT_BRAND;
  }
  if(!model) {
    model = '';
  }

  return {
      url: `${ROOT_URL}/listing_auto.php?marque=${brand}&modele=${model}`,
      headers: {
        'Cookie': 'NAPP=' + maxResults
      },
      jar: true
    }

}

module.exports = router;

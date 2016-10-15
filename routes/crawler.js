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

let getCar = function(id) {
  perfy.start(`request-${id}`);  
  console.log(`Getting car ${id}`);
  return rp(getCarParams(id))
    .then(function(body) {
      let elapsed = perfy.end(`request-${id}`);  
      console.log(`car ${id} fetched in ${elapsed.time}ms`.green);
      let result = getCarFromResponse(body);

      return new Promise(function(resolve, reject) { 
          resolve(result);
      });
    })
    .catch(function (err) {
      console.log('car could not be fetched'.red);
    });  
}

let getCars = function(params) {
  perfy.start('request');

  return rp(getSearchParams(params))
    .then(function(body) {
      console.log('search OK'.green);
      let result = getResultsFromResponse(body);

      return new Promise(function(resolve, reject) { 
          resolve(result);
      });
    })
    .catch(function (err) {
      console.log('search KO'.red);
    });   
}

let getCarFromResponse = function(body) {
  const $ = cheerio.load(body);

  var brand = $('h1.iophfzp')[0].children[0].data.trim();

  var name = '';

  $('h1.iophfzp').children().each(function(i, elem) {
    name += $(this).text().trim();
    name += ' ';
  });

  return {
    brand: brand,
    name : name
  }

}

let getResultsFromResponse = function(body) {
      const $ = cheerio.load(body);

      const cars = $('a.ann');
      let foundCars = [];

      for (let i = 0; i < cars.length; i++) {
        let car = cars[i];
        let foundCar = {};
        
        foundCar.url = getCarUrl(car.attribs['href']);
        foundCar.brand = getCarBrand($, $(car));
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

      let elapsed = perfy.end('request');

      return {
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

  return name.trim();
}

let getCarBrand = function($, carNode) {
  return carNode.find($('h3 span')).first().text().trim();
}

let getCarUrl = function(endOfUrl) {
  return `${ROOT_URL}${endOfUrl}`;
}

let getCarImageUrl = function($, carNode) {
  let imageUrl = carNode.find($('.imgContent>img')).first().attr('src')
  return imageUrl.replace('-minivign', '');
}

let getCarParams = function(id) {
  return {
    url: `${ROOT_URL}/auto-occasion-annonce-${id}.html`
  }
}

let getSearchParams = function(params) {
  let brand = params.brand;
  let model = params.model;
  let maxResults = params.maxResults;

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

module.exports = {
    
    getCar: getCar,
    getCars: getCars

};
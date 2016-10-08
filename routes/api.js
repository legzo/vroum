let express = require('express');
let router = express.Router();
let request = require('request');
let cheerio = require('cheerio');
let colors = require('colors');
var perfy = require('perfy');

const rootUrl = 'http://www.lacentrale.fr';
const maxResults = 30;

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
  return `${rootUrl}${endOfUrl}`;
}

let getCarImageUrl = function($, carNode) {
  let imageUrl = carNode.find($('.imgContent>img')).first().attr('src')
  return imageUrl.replace('-minivign', '');
}

router.get('/cars', function(req, res) {

  let brand = req.query.brand;
  let model = req.query.model;

  if(!brand) {
    brand = 'SKODA';
  }
  if(!model) {
    model = '';
  }

  //const url = 'http://www.lacentrale.fr/listing_auto.php?marque=SKODA&modele=SUPERB&mo_comm=SUPERB+3';
  const url = `${rootUrl}/listing_auto.php?marque=${brand}&modele=${model}`; 

  perfy.start('request');

  request.get({
      url: url,
      headers: {
        'Cookie': 'NAPP=' + maxResults
      },
      jar: true
    }, function(error, response, body) {

      if (!error && response.statusCode == 200) {
        console.log('search OK'.green);
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

        var elapsed = perfy.end('request');

        let result = {
          infos : {
            elapsed : elapsed.time,
            results : foundCars.length,
            maxPrice : maxPrice,
            minPrice : minPrice,
            cheapest : cheapCars
          },
          cars : foundCars
        };
        
        res.json(result);

      } else {
        console.log('search KO'.red);
        res.json({ msg : 'error occured :/'});
      }    
    });
  
});

module.exports = router;

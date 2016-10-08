let express = require('express');
let router = express.Router();
let request = require('request');
let cheerio = require('cheerio');
let colors = require('colors');

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
}

router.get('/', function(req, res) {

  const url = 'http://www.lacentrale.fr/listing_auto.php?marque=SKODA&modele=SUPERB&mo_comm=SUPERB+3';

  request.get({
      url: url,
      headers: {
        'Cookie': 'NAPP=100'
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
          
          foundCar.url = car.attribs['href'];
          foundCar.name = getCarName($, $(car));
          foundCar.imageUrl = $(car).find($('.imgContent>img')).first().attr('src');
          foundCar.location = getNumericField($, $(car), '.pictoFrance');
          foundCar.year = getNumericField($, $(car), '.fieldYear');
          foundCar.mileage = getNumericField($, $(car), '.fieldMileage', 'km');
          foundCar.price = getNumericField($, $(car), '.fieldPrice', '€');

          foundCars.push(foundCar);
        }

        const minPrice = Math.min(...foundCars.map(car => car.price));
        const maxPrice = Math.max(...foundCars.map(car => car.price));

        let cheapCars = foundCars.filter(car => car.price === minPrice);

        let result = {
          infos : {
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

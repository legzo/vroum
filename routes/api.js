var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {

  res.json({ test: {P : 'test' }});
  
});

module.exports = router;

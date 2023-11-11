var express = require('express');
const { protect, protectWithRendering } = require('../controllers/authController');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  return res.render('chat', { title: 'Express', message: '' });
});

router.get('/login', function (req,res,next) {
  return res.render('login', {
    message: ''
  });
});

// router.get('/signup', function (req,res,next) {
//   return res.render('signup', {
//     message: ''
//   });
// });

module.exports = router

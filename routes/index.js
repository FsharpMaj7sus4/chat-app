var express = require("express")
const { protect } = require("../controllers/authController")
var router = express.Router()
const upload = require('../utils/multer')

/* GET home page. */
router.get("/", protect, function (req, res, next) {
  const { id, name, phone } = req.user
  return res.render("chat", {
    userId: id,
    userName: name,
    userPhone: phone,
    token: req.cookies.jwt,
  })
})

router.get("/login", function (req, res, next) {
  return res.render("login", {
    message: "",
  })
})

router.post('/upload', upload.single('file'), function (req, res, next) {
  return res.status(200).json(req.file)
})


// router.get('/signup', function (req,res,next) {
//   return res.render('signup', {
//     message: ''
//   });
// });

// heyyyyyyyyyyyy

module.exports = router

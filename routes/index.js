var express = require("express")
const { protect } = require("../controllers/authController")
var router = express.Router()

/* GET home page. */
router.get("/", protect, function (req, res, next) {
  return res.render("chat", { title: "Express", message: "" })
})

router.get("/login", function (req, res, next) {
  return res.render("login", {
    message: "",
  })
})

// router.get('/signup', function (req,res,next) {
//   return res.render('signup', {
//     message: ''
//   });
// });

module.exports = router

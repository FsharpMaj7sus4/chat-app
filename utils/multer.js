const multer = require('multer')
const path = require('path')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '---' + file.originalname.substring(0, 20) + path.extname(file.originalname)) //Appending extension
    }
})

const upload = multer({ storage })

module.exports = upload
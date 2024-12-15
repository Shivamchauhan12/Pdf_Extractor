 // Import the required modules
const express = require("express")
const router = express.Router()
const {extract}=require("../controllers/Extract")


router.post("/extract",extract);
module.exports = router
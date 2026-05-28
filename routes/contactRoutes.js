const express = require("express");
const router = express.Router();

const {
  addContacts,
  getContacts
} = require("../controllers/contactController");

router.post("/add", addContacts);
router.get("/", getContacts);

module.exports = router;
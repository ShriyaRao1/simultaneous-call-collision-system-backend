const express = require("express");
const router = express.Router();

const {
  addContacts,
  getContacts
} = require("../controllers/contactController");

// ✅ ADD CONTACT
router.post("/add", async (req, res) => {
  try {
    await addContacts(req, res);
  } catch (err) {
    console.error("Add Contact Error:", err);
    res.status(500).json({ error: "Server error while adding contact" });
  }
});

// ✅ GET CONTACTS
router.get("/", async (req, res) => {
  try {
    await getContacts(req, res);
  } catch (err) {
    console.error("Get Contacts Error:", err);
    res.status(500).json({ error: "Server error while fetching contacts" });
  }
});

module.exports = router;
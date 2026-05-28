const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

// ✅ REGISTER (with name + phone + password)
router.post("/register", registerUser);

// ✅ LOGIN (using phone + password)
router.post("/login", loginUser);

// ✅ OPTIONAL: GET CURRENT USER (useful later)
router.get("/me", (req, res) => {
  res.json({
    message: "User route working",
  });
});

module.exports = router;
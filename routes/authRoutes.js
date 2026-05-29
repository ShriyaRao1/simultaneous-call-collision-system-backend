const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

// ✅ REGISTER
router.post("/register", registerUser);

// ✅ LOGIN
router.post("/login", loginUser);

// ✅ TEST ROUTE
router.get("/me", (req, res) => {
  res.json({
    message: "Auth route working ✅",
  });
});

module.exports = router;
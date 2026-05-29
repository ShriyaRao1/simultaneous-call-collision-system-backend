const pool = require("../db"); // ✅ FIXED PATH
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ✅ REGISTER USER
const registerUser = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // ✅ CHECK EXISTING USER
    const userExists = await pool.query(
      "SELECT * FROM users WHERE phone=$1",
      [phone]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // ✅ HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ INSERT USER
    const newUser = await pool.query(
      "INSERT INTO users(name, phone, password) VALUES($1,$2,$3) RETURNING id, name, phone",
      [name, phone, hashedPassword]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

// ✅ LOGIN USER
const loginUser = async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password are required",
      });
    }

    // ✅ FIND USER
    const user = await pool.query(
      "SELECT * FROM users WHERE phone=$1",
      [phone]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ✅ CHECK PASSWORD
    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ✅ JWT TOKEN
    const token = jwt.sign(
      { phone: user.rows[0].phone },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        phone: user.rows[0].phone,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
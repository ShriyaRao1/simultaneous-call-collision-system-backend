const pool = require("../db");

// ✅ ADD CONTACT
const addContacts = async (req, res) => {
  try {
    const { user_phone, contact_phone } = req.body;

    if (!user_phone || !contact_phone) {
      return res.status(400).json({
        message: "user_phone and contact_phone required",
      });
    }

    // ✅ GET USER ID
    const userResult = await pool.query(
      "SELECT id FROM users WHERE phone=$1",
      [user_phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const user_id = userResult.rows[0].id;

    // ✅ INSERT (avoid duplicate crash)
    await pool.query(
      "INSERT INTO contacts(user_id, contact_phone) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [user_id, contact_phone]
    );

    res.json({ message: "Contact added successfully" });

  } catch (error) {
    console.error("ADD CONTACT ERROR:", error);

    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

// ✅ GET CONTACTS
const getContacts = async (req, res) => {
  try {
    const { user_phone } = req.query;

    if (!user_phone) {
      return res.status(400).json({
        message: "user_phone required",
      });
    }

    // ✅ GET USER ID
    const userResult = await pool.query(
      "SELECT id FROM users WHERE phone=$1",
      [user_phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const user_id = userResult.rows[0].id;

    // ✅ IMPORTANT FIX HERE 👇
    const result = await pool.query(
      `SELECT u.id, u.name, u.phone
       FROM contacts c
       JOIN users u ON c.contact_phone = u.phone
       WHERE c.user_id = $1`,
      [user_id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("GET CONTACT ERROR:", error);

    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

module.exports = {
  addContacts,
  getContacts,
};
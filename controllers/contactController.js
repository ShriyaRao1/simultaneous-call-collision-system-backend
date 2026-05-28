const pool = require("../config/db");

// ✅ ADD CONTACTS
const addContacts = async (req, res) => {
  try {
    const { user_id, contacts } = req.body;

    for (let phone of contacts) {
      try {
        await pool.query(
          "INSERT INTO contacts(user_id, contact_phone) VALUES($1,$2)",
          [user_id, phone]
        );
      } catch (err) {
        if (err.code === "23505") {
          console.log("Duplicate skipped:", phone);
        } else {
          throw err;
        }
      }
    }

    res.json({ message: "Contacts saved" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET CONTACTS
const getContacts = async (req, res) => {
  try {
    const { user_id } = req.query;

    const result = await pool.query(
      `SELECT u.id, u.name, u.phone
       FROM contacts c
       JOIN users u ON c.contact_phone = u.phone
       WHERE c.user_id = $1`,
      [user_id]
    );

    console.log("FINAL CONTACTS:", result.rows);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addContacts,
  getContacts,
};
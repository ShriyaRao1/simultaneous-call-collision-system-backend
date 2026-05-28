CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(20) UNIQUE,
  password VARCHAR(255),
  fcm_token TEXT
);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  user_id INT,
  contact_phone VARCHAR(20),
  UNIQUE(user_id, contact_phone)
);
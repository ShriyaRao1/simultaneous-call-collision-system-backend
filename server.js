require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./config/db");

// ROUTES
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");

// FIREBASE
// const admin = require("firebase-admin");
// const serviceAccount = require("./firebase-admin.json");

//admin.initializeApp({
  //credential: admin.credential.cert(serviceAccount),
//});

const app = express();

// ✅ SIMPLE CORS (best for local + WiFi)
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/contacts", contactRoutes);

// TEST
app.get("/test", (req, res) => {
  res.send("Backend working");
});

// SERVER
const server = http.createServer(app);

// SOCKET
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const onlineUsers = {};

// PUSH
//const sendPushNotification = async (token, from) => {
  //try {
    //await admin.messaging().send({
      //token,
      //notification: {
        //title: "Incoming Call 📞",
        //body: `Call from ${from}`,
      //},
    //});
  //} catch (err) {
    //console.log("Push error:", err);
  //}
//};

// SAVE TOKEN
app.post("/save-token", async (req, res) => {
  const { phone, fcmToken } = req.body;

  try {
    await pool.query(
      "UPDATE users SET fcm_token=$1 WHERE phone=$2",
      [fcmToken, phone]
    );

    res.send("Token saved");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error saving token");
  }
});

// SOCKET LOGIC
io.on("connection", (socket) => {
  console.log("New client:", socket.id);

  socket.on("join", ({ phone }) => {
    onlineUsers[phone] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("callUser", async ({ from, to, offer, type }) => {
    const target = onlineUsers[to];

    if (target) {
      io.to(target).emit("incomingCall", { from, offer, type });
    } else {
      try {
        const user = await pool.query(
          "SELECT fcm_token FROM users WHERE phone=$1",
          [to]
        );

        if (user.rows[0]?.fcm_token) {
         // await sendPushNotification(user.rows[0].fcm_token, from);
        }
      } catch (err) {
        console.log(err);
      }
    }
  });

  socket.on("acceptCall", ({ from, answer }) => {
    const target = onlineUsers[from];
    if (target) io.to(target).emit("callStarted", { answer });
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    const target = onlineUsers[to];
    if (target) io.to(target).emit("iceCandidate", { candidate });
  });

  socket.on("endCall", ({ to, from }) => {
    const target = onlineUsers[to];
    if (target) io.to(target).emit("callEnded", { by: from });
  });

  socket.on("rejectCall", ({ to, from }) => {
    const target = onlineUsers[to];
    if (target) io.to(target).emit("callRejected", { by: from });
  });

  socket.on("disconnect", () => {
    for (let phone in onlineUsers) {
      if (onlineUsers[phone] === socket.id) {
        delete onlineUsers[phone];
        break;
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
});

// 🚀 IMPORTANT: allow other devices
server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
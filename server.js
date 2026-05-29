const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ CORS (fixed properly)
const allowedOrigins = [
  "http://localhost:3000",
  "https://janitor-january-operative.ngrok-free.dev"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// ✅ DB IMPORT
const pool = require("./db");

// ✅ ROUTES
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");

app.use("/api/auth", authRoutes);
app.use("/contacts", contactRoutes);

// ✅ TEST ROUTE
app.get("/test", (req, res) => {
  res.send("Backend is working 🚀");
});

// ✅ DB TEST ROUTE (YOU WERE MISSING THIS)
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "DB connected ✅",
      time: result.rows[0],
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({
      message: "DB failed ❌",
      error: err.message,
    });
  }
});

// ✅ SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  }
});

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", ({ phone }) => {
    onlineUsers[phone] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("callUser", ({ from, to, offer, type }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("incomingCall", {
        from,
        offer,
        type
      });
    }
  });

  socket.on("acceptCall", ({ from, answer }) => {
    if (onlineUsers[from]) {
      io.to(onlineUsers[from]).emit("callStarted", { answer });
    }
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("iceCandidate", { candidate });
    }
  });

  socket.on("endCall", ({ to }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("callEnded");
    }
  });

  socket.on("rejectCall", ({ to }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("callRejected");
    }
  });

  socket.on("disconnect", () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("User disconnected:", socket.id);
  });
});

// ✅ PORT
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
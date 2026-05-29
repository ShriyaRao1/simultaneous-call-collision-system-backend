const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://janitor-january-operative.ngrok-free.dev"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// ✅ Routes
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");

app.use("/api/auth", authRoutes);
app.use("/contacts", contactRoutes);

// ✅ Test route
app.get("/test", (req, res) => {
  res.send("Backend is working 🚀");
});

// ✅ Socket
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

let onlineUsers = {};

io.on("connection", (socket) => {
  socket.on("join", ({ phone }) => {
    onlineUsers[phone] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("callUser", ({ from, to, offer, type }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("incomingCall", {
        from, offer, type
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

  socket.on("disconnect", () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ CORS (VERY IMPORTANT)
app.use(cors({
  origin: "https://call-h5djby2ts-chinmayi-h-k-s-projects.vercel.app",
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

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "https://call-h5djby2ts-chinmayi-h-k-s-projects.vercel.app",
    methods: ["GET", "POST"]
  }
});

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ Register user
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
  });

  // ✅ Call user
  socket.on("callUser", ({ to, from, signal }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("incomingCall", { from, signal });
    }
  });

  // ✅ Answer call
  socket.on("answerCall", ({ to, signal }) => {
    io.to(onlineUsers[to]).emit("callAccepted", signal);
  });

  // ✅ Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }
  });
});

// ✅ PORT (Render requirement)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
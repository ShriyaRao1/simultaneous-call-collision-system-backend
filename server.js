const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ FIXED CORS (allow BOTH localhost + vercel)
const allowedOrigins = [
  "http://localhost:3000",
  "https://call-h5djby2ts-chinmayi-h-k-s-projects.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman
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

// ✅ Routes
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");

app.use("/api/auth", authRoutes);
app.use("/contacts", contactRoutes);

// ✅ Test route
app.get("/test", (req, res) => {
  res.send("Backend is working 🚀");
});

// ✅ SOCKET.IO (FIXED CORS)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  }
});

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ JOIN (match frontend)
  socket.on("join", ({ phone }) => {
    onlineUsers[phone] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  // ✅ CALL USER
  socket.on("callUser", ({ from, to, offer, type }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("incomingCall", {
        from,
        offer,
        type
      });
    }
  });

  // ✅ ACCEPT CALL
  socket.on("acceptCall", ({ from, to, answer }) => {
    if (onlineUsers[from]) {
      io.to(onlineUsers[from]).emit("callStarted", {
        answer
      });
    }
  });

  // ✅ ICE CANDIDATE (VERY IMPORTANT)
  socket.on("iceCandidate", ({ to, candidate }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("iceCandidate", {
        candidate
      });
    }
  });

  // ✅ END CALL
  socket.on("endCall", ({ to }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("callEnded");
    }
  });

  // ✅ REJECT CALL
  socket.on("rejectCall", ({ to }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("callRejected");
    }
  });

  // ✅ DISCONNECT
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
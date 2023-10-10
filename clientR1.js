require('dotenv').config();
const socket = require("socket.io-client")(process.env.SERVER_URL);
const express = require("express");
const { createToken, verifyToken } = require("./jwtMiddleware");
const port = process.env.PORT;

const app = express();

app.use(express.json()); // Add this line to parse JSON data

const users = [
    { username: process.env.USERNAME, password: process.env.PASSWORD }
  ];

app.get("/", (req, res) => {
  res.send({"message": "Hi, How are you feeling today?", "status": "OK"});
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username && u.password === password);

  if (user) {
    const token = createToken(user);
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.post("/api/:cid", verifyToken, (req, res) => {
  let patientCid = req.params.cid;
  let send_message =
    '{"datatype": "service","data": {"CID":"' +
    patientCid +
    '","viewer_id": "' +
    socket.id +
    '","client_id":"","his_data":""}}';

  // Set a flag to track whether the response has been sent
  let responseSent = false;

  // ส่งข้อมูลไปยังเซิร์ฟเวอร์
  socket.emit("viewer", send_message);
  console.log("Sending message:", send_message);

  // รับข้อมูลจากเซิร์ฟเวอร์
  socket.on("viewer", (message) => {
    // Check if the response has already been sent
    if (!responseSent) {
      console.log("Received message:", message);
      res.send(message);
      responseSent = true;
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});

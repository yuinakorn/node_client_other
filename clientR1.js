require("dotenv").config();
const socket = require("socket.io-client")(process.env.SERVER_URL);
const express = require("express");
const jwt = require('jsonwebtoken');
const { createToken, verifyToken } = require("./jwtMiddleware");
const { getLogs } = require("./logs");

const port = process.env.PORT;

const app = express();

app.use(express.json()); // Add this line to parse JSON data

const users = [
  { username: process.env.USERNAME, password: process.env.PASSWORD },
];

app.get("/", (req, res) => {
  res.send({ message: "Hi, How are you feeling today?", status: "OK" });
});

app.post("/api/login", (req, res) => {
  const { user, accessKey, userCid, userHoscode } = req.body;


  const user_login = users.find(
    (u) => u.username === user && u.password === accessKey
  );

  const auth_user = { userCid, userHoscode };

  if (user_login) {
    const token = createToken(user_login,auth_user);
    console.log("user = " + JSON.stringify(user_login));
    console.log("auth_user = " + JSON.stringify(auth_user));
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.post("/api/:cid", verifyToken, (req, res) => {
  let patientCid = req.params.cid;
  let message_emit =
    '{"datatype": "service","data": {"CID":"' +
    patientCid +
    '","viewer_id": "' +
    socket.id +
    '","client_id":"","his_data":""}}';

    const token = req.headers.authorization;
    const secretKey = process.env.SECRET_KEY;

    try {
      // Decode the token
      const decodedToken = jwt.verify(token, secretKey);
      console.log(decodedToken);
    
      // You can access specific properties from the payload
      const t_user = decodedToken.sub;
      const t_cid = decodedToken.cid;
      const t_hcode = decodedToken.hcode;
    
      // Use the decoded data in your application logic
      // send to save log in database

      let log = getLogs(t_user,t_cid,t_hcode,patientCid);
      console.log(log);
      

    } catch (error) {
      // If the token is invalid or expired, an error will be thrown
      console.error('Invalid token:', error.message);
    }

  // Set a flag to track whether the response has been sent
  let responseSent = false;

  // ส่งข้อมูลไปยังเซิร์ฟเวอร์
  socket.emit("viewer", message_emit);
  console.log("Sending message:", message_emit);

  // รับข้อมูลจากเซิร์ฟเวอร์
  socket.on("viewer", (receive_data) => {
    // Check if the response has already been sent
    if (!responseSent) {
      let jdata = JSON.parse(receive_data);
      let len = Object.keys(jdata).length;

      let time_now = new Date();
      // show date time in Thailand
      time_now.setHours(time_now.getHours() + 7);

      console.log("receive_data:", {
        call_at: time_now,
        patient_cid: jdata[0]["cidx"],
        length_data: len,
      });
      res.send(receive_data);
      responseSent = true;
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});

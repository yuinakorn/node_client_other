const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.SECRET_KEY; 

// Middleware to create JWT token
function createToken(user, auth_user) {
  return jwt.sign({ sub: user.username, cid: auth_user.userCid, hcode: auth_user.userHoscode }, secretKey, {
    expiresIn: '1h' // Token expires in 1 hour
  });
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  // Check the Authorization header for the JWT token
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  // Verify the token using the secret key
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
        console.log(token)
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    // If the token is valid, set the user object in the request and call the next middleware
    req.user = user;
    next();
  });
}

module.exports = { createToken, verifyToken };

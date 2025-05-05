import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const fetchUser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(400).send("Invalid token.");
  }
};

export default fetchUser;

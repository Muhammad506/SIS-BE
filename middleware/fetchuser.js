import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const fetchUser = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Access denied. No token provided.");
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (error) {
    res.status(400).send("Invalid token.");
  }
};

export default fetchUser;

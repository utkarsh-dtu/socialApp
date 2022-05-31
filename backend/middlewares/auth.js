const User = require("../models/User");
const jwt = require("jsonwebtoken");

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * this method is to determine whether the user is logged in or not
 * will be used in the middleware stack, the protect the routes
 */

exports.isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    // console.log(token);
    if (!token) {
      return res.status(401).json({ message: "Please login first" });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id);
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const express = require("express");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const path = require("path");
const app = express();

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "backend/config/config.env" });
}

const limiter = rateLimit({
  max: 100000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

/**Middleware functions for rate limiting and body-parser */
app.use("/api", limiter);
app.use(express.json({ limit: "50mb" }));

/**
 * data sanitization against NoSql query injection and against XSS
 * look at req.body, req.query and params to remove any malicious mongoDB queries, and removes these
 * */
app.use(mongoSanitize());

/**
 * Data sanitization, to prevent injection of malicious Html and javascript code
 */
app.use(xss());

app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

/**Importing routes */
const post = require("./routes/post");
const user = require("./routes/user");

app.use("/api/v1", user);
app.use("/api/v1", post);

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});

module.exports = app;

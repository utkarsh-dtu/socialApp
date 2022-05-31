const express = require("express");

const router = express.Router();

// router.route("/register ").post(register);
router.route("/show ").get((req, res) => {
  res.json("faaltu");
});

module.exports = router;

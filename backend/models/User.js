const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter a name"],
  },

  avatar: {
    public_id: String,
    url: String,
  },

  email: {
    type: String,
    required: [true, "Please enter a email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: [6, "password must be at least 6 characters long"],
    select: false,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

/**
 * hashing the password before it gets saved to the database
 * the password will be hashed only when the password gets modified, if the password
 * did not get updated, we dont want to hash it again
 *  */

userSchema.pre("save", async function (next) {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 10);

  next();
});

/**
 * this doccument method matches the password that the user enters with the password
 * that exists in the database
 */
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * generates the jwt
 */
userSchema.methods.generateToken = async function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
};

userSchema.methods.getResetPasswordToken = async function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);

const { sendEmail } = require("../middlewares/sendEmail");
const Post = require("../models/Post");
const User = require("../models/User");
const crypto = require("crypto");
const cloudinary = require("cloudinary");

exports.register = async (req, res) => {
  console.log("register was called!!");

  try {
    const { name, email, password, avatar } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already registered" });
    }

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatars",
    });

    user = await User.create({
      name,
      email,
      password,
      avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
    });

    const token = user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    return res
      .status(201)
      .cookie("token", token, options)
      .json({ success: true, user, token, message: "registered succesfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
      .select("+password")
      .populate("posts followers following");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "incorrect password" });
    }

    const token = await user.generateToken();

    // console.log("generated token : ", token);
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    return res
      .status(200)
      .cookie("token", token, options)
      .json({ success: true, user, token });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "ef", {
        expires: new Date(Date.now() + 30),
        httpOnly: true,
      })
      .json({ success: true, message: "Logged Out" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (loggedInUser.following.includes(userToFollow._id)) {
      const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
      const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id);

      loggedInUser.following.splice(indexfollowing, 1);

      userToFollow.followers.splice(indexfollowers, 1);

      await loggedInUser.save();
      await userToFollow.save();

      return res
        .status(200)
        .json({ success: true, message: "User Unfollowed" });
    } else {
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);
      await loggedInUser.save();
      await userToFollow.save();

      return res.status(200).json({ success: true, message: "User followed" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**password update controller */

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Provide old password and new password",
      });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "incorrect old password",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "password updated",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, email, avatar } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;

    if (avatar) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);

      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatar",
      });

      user.avatar.public_id = myCloud.public_id;
      user.avatar.url = myCloud.secure_url;
    }
    // User avatar todo
    await user.save();
    return res.status(200).json({ success: true, message: "Profile updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = user.posts;
    const followers = user.followers;
    const following = user.following;
    const userId = user._id;

    //removing avatar
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    await user.remove();

    // logout user after deleting profile

    res.cookie("token", "ef", {
      expires: new Date(Date.now() + 30),
      httpOnly: true,
    });

    for (let i = 0; i < posts.length; i++) {
      const post = await Post.findById(posts[i]);
      await cloudinary.v2.uploader.destroy(post.image.public_id);
      await post.remove();
    }

    for (let i = 0; i < followers.length; i++) {
      const follower = await User.findById(followers[i]);
      const index = follower.following.indexOf(userId);
      follower.following.splice(index, 1);
      await follower.save();
    }

    for (let i = 0; i < following.length; i++) {
      const follows = await User.findById(following[i]);
      const index = follows.followers.indexOf(userId);
      follows.followers.splice(index, 1);
      await follows.save();
    }

    // removing all comments of the user from all posts
    const allPosts = await Post.find();
    for (let i = 0; i < allPosts.length; i++) {
      const post = await Post.findById(allPosts[i]._id);
      for (let j = 0; j < post.comments.length; j++) {
        if (post.comments[j].user === userId) {
          post.comments.splice(j, 1);
        }
      }
      await post.save();
    }
    // removing all likes of the user from all posts
    for (let i = 0; i < allPosts.length; i++) {
      const post = await Post.findById(allPosts[i]._id);
      for (let j = 0; j < post.likes.length; j++) {
        if (post.likes[j] === userId) {
          post.likes.splice(j, 1);
        }
      }
      await post.save();
    }

    return res
      .status(200)
      .json({ success: true, message: "Profile deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "posts followers following"
    );
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserProfile = async function (req, res) {
  try {
    const user = await User.findById(req.params.id).populate(
      "posts followers following"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      name: { $regex: req.query.name, $options: "i" },
    });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    console.log("forgotPassword was called!");
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const resetPasswordToken = await user.getResetPasswordToken();
    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/password/reset/${resetPasswordToken}`;

    const message = `Reset you password by clicking on the link below \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "reset password",
        message,
      });

      res
        .status(200)
        .json({ success: true, message: `Email send to ${user.email}` });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500).json({ success: false, error: error.message });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const users = await User.findById(req.user._id);
    const posts = [];
    for (let i = 0; i < users.posts.length; i++) {
      const post = await Post.findById(users.posts[i]).populate(
        "owner likes comments.user"
      );
      posts.push(post);
    }

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const users = await User.findById(req.params.id);
    const posts = [];
    for (let i = 0; i < users.posts.length; i++) {
      const post = await Post.findById(users.posts[i]).populate(
        "owner likes comments.user"
      );
      posts.push(post);
    }

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

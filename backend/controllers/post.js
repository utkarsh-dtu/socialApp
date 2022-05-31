const User = require("../models/User");
const Post = require("../models/Post");
const cloudinary = require("cloudinary");
exports.createPost = async (req, res) => {
  try {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.image, {
      folder: "posts",
    });
    const newPostData = {
      caption: req.body.caption,
      image: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      owner: req.user._id,
    };

    const post = await Post.create(newPostData);
    const user = await User.findById(req.user._id);

    /** push this post inside the posts array of the logged in user */
    user.posts.unshift(post._id);

    await user.save();
    return res.status(201).json({
      success: true,
      message: "Post Created",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Unauthorised" });
    }

    await cloudinary.v2.uploader.destroy(post.image.public_id);

    await post.remove();
    const user = await User.findById(req.user._id);
    const index = user.posts.indexOf(req.params.id);
    user.posts.splice(index, 1);
    await user.save();

    return res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.likeAndUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    if (post.likes.includes(req.user._id)) {
      const index = post.likes.indexOf(req.user._id);
      post.likes.splice(index, 1);
      await post.save();
      return res.status(200).json({ success: true, message: "Post Unliked" });
    } else {
      await post.likes.push(req.user._id);
      await post.save();
      return res.status(200).json({ success: true, message: "Post liked" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPostOfFollowing = async (req, res) => {
  /**
   * following contains the user id of the user that the logged in user is followin
   * .populate will add the entire user object instead of just having the user id
   * posts will just add the post fild of the thing that it is populated with
  
   */

  try {
    const user = await User.findById(req.user._id);

    /** get the posts of all the users which the logged in user is following*/
    const posts = await Post.find({
      owner: {
        $in: user.following,
      },
    }).populate("owner likes comments.user");

    return res.status(200).json({ success: true, posts: posts.reverse() });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCaption = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    post.caption = req.body.caption;
    await post.save();
    return res.status(200).json({ success: true, message: "Post updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.commentOnPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    let commentIndex = -1;

    /**checking if comment already exists */
    post.comments.forEach((item, index) => {
      if (item.user.toString() === req.user._id.toString()) {
        commentIndex = index;
      }
    });

    if (commentIndex !== -1) {
      post.comments[commentIndex].comment = req.body.comment;

      await post.save();
      return res
        .status(200)
        .json({ success: true, message: "Comment Updated" });
    } else {
      post.comments.push({
        user: req.user._id,
        comment: req.body.comment,
      });

      await post.save();
      return res.status(200).json({ success: true, message: "Comment added" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    /**checkng if owner wants to delete */
    if (post.owner.toString() === req.user._id.toString()) {
      if (req.body.commentId === undefined) {
        return res.status(400).json({
          success: false,
          message: "Commend Id required",
        });
      }
      post.comments.forEach((item, index) => {
        if (item._id.toString() === req.body.commentId.toString()) {
          // commentIndex = index;
          return post.comments.splice(index, 1);
        }
      });
      await post.save();
      return res
        .status(200)
        .json({ success: true, message: "selected comment has been deleted" });
    } else {
      // return res.status(401).
      post.comments.forEach((item, index) => {
        if (item.user.toString() === req.user._id.toString()) {
          // commentIndex = index;
          return post.comments.splice(index, 1);
        }
      });

      await post.save();
      return res
        .status(200)
        .json({ success: true, message: "your comment has been deleted" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

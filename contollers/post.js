import Post from "../models/post";
import cloudinary from "cloudinary";
import post from "../models/post";
import User from "../models/User";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const createPost = async (req, res) => {
  const { content, image } = req.body;

  if (!content.length) {
    return res.json({
      error: "content is required",
    });
  }

  try {
    const post = new Post({ content, image, postedBy: req.user._id });
    post.save();
    return res.json({
      ok: true,
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const uploadImage = async (req, res) => {
  // console.log(req.files);
  try {
    const result = await cloudinary.uploader.upload(req.files.image.path);
    // console.log("image url`=>", result);
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.log(err);
  }
};

export const postByUser = async (req, res) => {
  try {
    // const posts = await Post.find({ postedBy: req.user._id })
    const posts = await Post.find()
      .populate("postedBy", "_id image name")
      .limit(10)
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

export const userPost = async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params._id })
      .populate("postedBy", " _id name image")
      .populate("comments.postedBy", " _id name image");
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params._id, req.body, {
      new: true,
    });
    res.json(post);
    // console.log("update post =>", req.body);
  } catch (err) {
    console.log(err);
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params._id);
    if (post.image && post.image.public_id) {
      const image = await cloudinary.uploader.destroy(post.image.public_id);
      res.json({ ok: true });
    }
  } catch (err) {
    console.log(err);
  }
};

export const newsFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let following = user.following;
    following.push(req.user._id);
    //pagination
    const currentPage = req.params.page || 1;
    const perPage = 2;

    const posts = await Post.find({ postedBy: { $in: following } })
      .skip((currentPage - 1) * perPage)
      .populate("postedBy", "_id image name")
      .populate("comments.postedBy", " _id name image")
      .sort({ createdAt: -1 })
      .limit(perPage);
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

export const likePost = async (req, res) => {
  console.log("post data", req.body._id);
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        $addToSet: { likes: req.user._id },
      },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        $pull: { likes: req.user._id },
      },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};

export const addComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { text: comment, postedBy: req.user._id } },
      },
      {
        new: true,
      }
    )
      .populate("postedBy", " _id name image")
      .populate("comments.postedBy", " _id name image");
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};
export const removeComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { comments: comment },
      },
      {
        new: true,
      }
    );
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};

export const totalPosts = async (req, res) => {
  try {
    const total = await Post.find().estimatedDocumentCount();
    res.json(total);
  } catch (error) {
    console.log(error);
  }
};

export const posts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("postedBy", " _id name image")
      .sort({ createdAt: -1 })
      .limit(12);
    res.json(posts);
  } catch (error) {
    console.log(error);
  }
};

export const getPost = async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params._id })
      .populate("postedBy", " _id name image")
      .populate("comments.postedBy", " _id name image");
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

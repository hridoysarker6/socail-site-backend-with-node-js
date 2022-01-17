import User from "../models/User";
import { comparePassword, hashPassword } from "../helpers/auth";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
export const register = async (req, res) => {
  // console.log("register endpoint", req.body);
  const { name, email, password, secret } = req.body;

  // validation
  if (!name) return res.status(400).send("Name is required");
  if (!password || password.length < 6)
    return res.status(400).send("Password is required and 6 character long");
  if (!secret) return res.status(400).send("Answer is required");
  if (!email) return res.status(400).send("Email is required");

  const exist = await User.findOne({ email });
  if (exist) return res.status(400).send("This email has been taken already");

  const hashedPassword = await hashPassword(password);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    secret,
    userName: nanoid(6),
  });
  try {
    await user.save();
    console.log("saved user", user);
    return res.json({
      ok: true,
    });
  } catch (error) {
    console.log("register failed err", error);
    return res.status(400).send("error . try again");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("no user found");
    const match = await comparePassword(password, user.password);

    if (!match) return res.status(400).send("wrong password");

    // create sign in token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    user.password = undefined;
    user.secret = undefined;
    res.json({
      token,
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send("login error");
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({ ok: true });
    }
  } catch (error) {
    return res.status(400).send("could not fetch user");
  }
};

export const forgotPassword = async (req, res) => {
  // console.log(req.body);
  // validation
  const { email, newPassword, secret } = req.body;

  if (!newPassword || newPassword < 6) {
    return res.json({
      error: "New password is required and should be greater than 6 character",
    });
  }
  if (!secret) {
    return res.json({
      error: "secret is required",
    });
  }

  const user = await User.findOne({ email, secret });

  if (!user) {
    return res.json({
      error: "we can't verify you with those details",
    });
  }

  try {
    const hashed = await hashPassword(newPassword);

    await User.findByIdAndUpdate(user._id, { password: hashed });

    return res.json({
      ok: true,
    });
  } catch (error) {
    console.log(error);

    return res.json({
      error: "something went wrong. try again",
    });
  }
};

export const profileUpdate = async (req, res) => {
  try {
    let data = {};
    if (req.body.userName) {
      data.userName = req.body.userName;
    }
    if (req.body.name) {
      data.name = req.body.name;
    }
    if (req.body.about) {
      data.about = req.body.about;
    }
    if (req.body.secret) {
      data.secret = req.body.secret;
    }
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.json({
          error: "Password is required and should be min 6 character long.",
        });
      } else {
        data.password = await hashPassword(req.body.password);
      }
    }
    if (req.body.image) {
      data.image = req.body.image;
    }

    let user = await User.findByIdAndUpdate(req.user._id, data, { new: true });
    user.password = undefined;
    user.secret = undefined;
    // console.log(user);
    return res.json(user);
  } catch (err) {
    if (err.code == 11000) {
      return res.json({ error: "Duplicate user name" });
    }
    console.log(err);
  }
};

export const findPeople = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    //user following
    let following = user.following;
    following.push(user._id);

    const people = await User.find({ _id: { $nin: following } })
      .select("-password -secret")
      .limit(10);
    res.json(people);
  } catch (err) {
    console.log(err);
  }
};

export const addFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $addToSet: { followers: req.user._id },
    });

    next();
  } catch (error) {
    console.log(error);
  }
};
export const userFollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { following: req.body._id },
      },
      { new: true }
    ).select("-password -secret");

    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

export const userfollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const following = await User.find({ _id: user.following }).limit(100);
    res.json(following);
  } catch (error) {
    console.log(error);
  }
};

export const userfollowers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const followers = await User.find({ _id: user.followers }).limit(100);
    res.json(followers);
  } catch (error) {
    console.log(error);
  }
};

export const removeFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $pull: { followers: req.user._id },
    });
    next();
  } catch (error) {
    console.log(error);
  }
};

export const userUnfollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: req.body._id },
    });
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

export const searchUser = async (req, res) => {
  const { query } = req.params;
  if (!query) return;
  try {
    const user = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { userName: { $regex: query, $options: "i" } },
      ],
    }).select("-password -secret");
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ userName: req.params.userName }).select(
      "-password -secret"
    );
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

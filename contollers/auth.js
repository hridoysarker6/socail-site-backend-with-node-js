import User from "../models/User";
import { comparePassword, hashPassword } from "../helpers/auth";
import jwt from "jsonwebtoken";
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

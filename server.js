import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { readdirSync } from "fs";
import { Socket } from "socket.io";

const morgan = require("morgan");
require("dotenv").config();

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-type"],
  },
});

//db
mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log("database connected"))
  .catch((err) => console.log("database connection error", err));
// const connect = async () => {
//   const res = await mongoose.connect(process.env.DATABASE);
//   console.log(res);
// };
// connect();
// middlewares
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.CLIENT_URL],
  })
);

// auto load routes

readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

// Socket io
io.on("connect", (socket) => {
  console.log("socket io=>", socket.id);
});

const port = process.env.PORT || 8000;
http.listen(port, () => console.log(`server running on port ${port}`));

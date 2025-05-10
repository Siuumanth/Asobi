import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express()

app.use(express.static("public"))
//this means static images is in public folder

app.use(cookieParser());

//using middlewars to make our requests more secure
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))

//common middlewares
app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({extended: true,limit : "16kb"}))


//import routes
import healthcheckRouter from "./routes/hlthchk.routes.js"
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import likeRouter from "./routes/like.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import commentRouter from "./routes/comment.routes.js"
import { errorHandler } from "./middlewares/error.mw.js";

//routes
//this runs when the route is accessed
app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/users",userRouter) 
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/comments",commentRouter)
app.use(errorHandler)


// Needed to get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static HTML routes
app.get("/home", (req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "public") });
});

app.get("/watch", (req, res) => {
  res.sendFile("watch.html", { root: path.join(__dirname, "public") });
});

app.get("/channel", (req, res) => {
  res.sendFile("channel.html", { root: path.join(__dirname, "public") });
});

app.get("/upload", (req, res) => {
  res.sendFile("upload.html", { root: path.join(__dirname, "public") });
});

app.get("/login", (req, res) => {
  res.sendFile("login.html", { root: path.join(__dirname, "public") });
});

app.get("/signup", (req, res) => {
  res.sendFile("signup.html", { root: path.join(__dirname, "public") });
});


export{app}
import express from "express";
import cors from "cors";


//this app will be base on what we build on
const app = express()

//using middlewars to make our requests more secure
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))

//common middlewares
app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({extended: true,limit : "16kb"}))
app.use(express.static("public"))
//this means static images is in public folder



export{app}
import dotenv from 'dotenv';
import { app } from "./app.js";
import connectDB from './db/index.js';

//importing .env
dotenv.config()

// app is the base of Asobi

const PORT = process.env.PORT || 6000

//app starts listening only after database connected
connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log("Server is runnning on port",PORT)
    }) 
})
.catch((err) => {
    console.log("mongo connection error", err)
})


Lets create Asobi - an entertainment platform inspired by Youtube

1. Build backend project structure and 
 ### npm i --save-dev nodemon prettier

```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  ```

2. CORS - tells who should talk to ur db, its a middleware that comes in between ou requsts

```javascript

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
```


3. Added middlewars, set up atlas mongodb db, set up urls in connectDB, and did app.listen in index.js after that
   ```javascript
   const connectDB = async () => 
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: process.env.DB_NAME,
            serverSelectionTimeoutMS: 8000, // Wait 5 seconds before failing
        });
```
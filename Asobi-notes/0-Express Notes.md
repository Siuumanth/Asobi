## How router works:

**Express.js App + Router + Middleware Flow (Canvas Notes)**

---

### 1. **App Initialization & Middleware Setup**

```js
const app = express();

// Parse cookies
app.use(cookieParser());

// Enable CORS for specific origin and credentials
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Parse incoming JSON and URL-encoded form data
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files from the 'public' directory
app.use(express.static("public"));
```

### 2. **Import & Mount Routers**

```js
import healthcheckRouter from "./routes/hlthchk.routes.js";
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
```

---

### 3. **What does `app.use("/api/v1/users", userRouter)` do?**

- `userRouter` is a mini Express router object that defines routes like `/register`, `/login`, etc.
    
- `app.use("/api/v1/users", userRouter)` **mounts** this router at the base path `/api/v1/users`.
    
- This means:
    - `userRouter.route("/register")` becomes `POST /api/v1/users/register`

**Visualization:**
Incoming request: `POST /api/v1/users/register`  
→ passes through global middleware  
→ hits `userRouter`  
→ hits `/register` route

---
### 4. **Inside user.routes.js Example**

```js
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 }
  ]),
  registerUser
);

export default router;
```

### 5. **What Happens Here?**

- The router handles `POST /register`, but since it's mounted at `/api/v1/users`, the full route becomes:
    - `POST /api/v1/users/register`
- Middleware `upload.fields(...)` handles file uploads before `registerUser` runs.
- `registerUser` is wrapped with `asyncHandler` to safely catch async errors.

---
### 6. **Async Handler Explanation**

```js
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  }
}
```

- This avoids writing `try...catch` in every async route.
    
- If any error happens inside `registerUser`, `asyncHandler` passes it to Express’s error handler via `next(err)`.
    
---
### Summary
- `app.use()` registers middleware or routes.
- Routers help modularize routes (e.g., group all user-related routes).
- Prefixing with `"/api/v1/users"` ensures all routes inside the router are correctly scoped.
- Middleware like `upload.fields()` or `asyncHandler()` enhance functionality and error safety.

---
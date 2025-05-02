
# Middlewares for models:
In Mongoose, model middlewares (or hooks) allow you to run functions before or after certain operations (like save, remove, updateOne).

🔹 Types of Model Middleware/hooks:

- 1️⃣ Pre Middleware (pre) → Runs before an action (e.g., hashing a password before saving).

- 2️⃣ Post Middleware (post) → Runs after an action (e.g., logging after deleting a user).

🔹 Example:
```js
userSchema.pre("save", function (next) {
  this.username = this.username.toLowerCase(); // Ensure lowercase usernames
  next();
});

userSchema.post("remove", function (doc) {
  console.log(`User ${doc.username} was deleted`);
});
```
 ### Common Uses:
- Hashing passwords before saving.
- Automatically updating timestamps.
- Logging actions.
- Preventing deletion of important data.

--- 
# Hooks - same as middlewares
### **Pre Hooks (`pre`)**

- Run **before** an action.
- Used to **modify, validate, or check data** before it’s saved or queried.
- Common for:
    - Hashing passwords
    - Converting data (like lowercase usernames)
    - Adding default filters to queries
    - Validating inputs before updates
        
---
### 🔹 **Post Hooks (`post`)**

- Run **after** an action is completed.
- Used for **logging, cleanup, or triggering side effects**.
- Common for:
    - Logging actions (like deletion or updates)
    - Sending notifications
    - Analytics or tracking
    - Cache invalidation after updates

---
### 🧠 Key Points

- `pre` modifies or checks **before** the DB action.
- `post` reacts **after** the DB action.
- Works on both **document** (save, remove) and **query** (find, update) operations.
- Helps keep logic organized and reusable in Mongoose apps.

---

## Encryption:

We will use the `bcrypt` package
Encryption hook for user password:

```javascript

// pre hooks, next is for passing one middleware to another
// its like a ripple effect between middlewares
userSchema.pre("save", async function (next) {

   // This makes sure the password is only hashed if it was modified or newly set 
  if(!this.modified("password")) return next();

  this.password = bcrypt.hash(this.password, 10)

  next()
})

```
-`next()` is a function that tells Mongoose to move on to the next middleware or proceed with the operation.

- If you don't call `next()`, the save (or other operation) will hang and never complete.


Checking password same while login:
```javascript
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    //returns true or false
  return await bcrypt.compare(enteredPassword, this.password);
};
```

---

# JWTs:
Now we will be implementing JWTs to keep a user logged in, and putting that in the user models.

**JWT (JSON Web Token) - Notes**
- **What is JWT?**
    - JWT is a compact, URL-safe token format used for securely transmitting information between parties.
    - Commonly used for **authentication** and **authorization** in web apps.
        
- **Structure of JWT:**
    - Consists of three parts: **Header**, **Payload**, and **Signature**.
        - Header: Metadata about the token (e.g., algorithm used).
        - Payload: Contains claims (user info, token expiry, etc.).
        - Signature: Verifies the token's integrity using a secret.
            
- **Common Use Cases:**
    - Logging in users and maintaining sessions.
    - Access control for APIs (e.g., protect routes).
    - Stateless authentication — no need to store sessions on server.
    
- **Security Tips:**
    - Always use HTTPS to prevent token interception.
    - Set token expiry (`exp`) to limit validity period.
    - Store tokens securely (e.g., in `httpOnly` cookies for web apps).
    - Do not store sensitive data (like passwords) in JWT payloads.
        
- **Authentication Flow (Typical):**
    1. User logs in and receives JWT.
    2. Client stores the JWT (in local storage or cookie).
    3. On future requests, client sends JWT in headers.
    4. Server verifies token and processes the request if valid.

**This is also used by the server to identify the user and provide correct data.**

- ### **What JWT Looks Like:**
    - A JWT is a single string split into 3 parts by dots (.)
        
    - Example:
 ```javascript
    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
    eyJ1c2VySWQiOiIxMjM0NTYiLCJpYXQiOjE2NzEyMzQ1NjcsImV4cCI6MTY3MTIzODE2N30.
    SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 ```
        
- Each part is Base64Url encoded:
    - Header (decoded): `{ "alg": "HS256", "typ": "JWT" }`
    - Payload (decoded): `{ "userId": "123456", "iat": 1671234567, "exp": 1671238167 }`
    - Signature: A hashed value used to verify the token.


- Header: Metadata about the token (e.g., algorithm used).
- Payload: Contains claims (user info, token expiry, etc.).
- Signature: Verifies the token's integrity using a secret.

In js, we use `jsonwebtoken` package.

---
## Imp:
### What is a session?

A **session** in web development refers to a temporary interaction between a client (like a browser) and a server, used to maintain state across multiple requests. Since HTTP is stateless by default, a session allows the server to remember things like login status, user preferences, or items in a shopping cart. This is typically achieved by assigning the client a unique session ID, which is stored on the client side (often in cookies) and matched on the server side with corresponding session data. Sessions usually expire after a certain time or when the user logs out, enhancing both performance and security.

Also,
**Stateless Authentication** means the server doesn't store any session data. All user info is encoded in tokens (like JWT) and sent with each request. The server just verifies the token.

**Stateful Authentication** means the server stores session info (like a session ID) in memory or a database. The client sends a session ID, and the server checks its stored session data to verify the user.

##### **JWT: Access Tokens and Refresh Tokens Explained**

When building secure web applications, especially those using stateless authentication, it is common practice to issue **two types of tokens** to authenticated users: the **Access Token** and the **Refresh Token**. Both are JSON Web Tokens (JWT), but they serve different purposes and have different lifespans.

### Access Token

An **Access Token** is a short-lived token used to access protected resources. Once a user logs in, the server generates this token and sends it to the client. The client then attaches this token in the headers of subsequent requests to prove its identity. In the Mongoose model example, the `generateAccessToken()` method is defined on the schema:

```js
userSchema.methods.generateAccessToken = function () {
  return jsonwebtoken.sign({
    _id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName,
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  });
};
```

#### Explanation:

- The payload contains basic identifying information like `_id`, `email`, `username`, and `fullName`, which helps the server recognize the user on each request without querying the database repeatedly.
    
- `ACCESS_TOKEN_SECRET` is a secure string used to sign the token, ensuring it hasn’t been tampered with.
    
- `expiresIn` determines how long the token is valid — typically short (e.g., 15 minutes) to minimize risk in case it’s stolen.
    
### Refresh Token

A **Refresh Token** is a longer-lived token used to obtain a new Access Token without requiring the user to log in again. Since Access Tokens are short-lived, Refresh Tokens provide a way to maintain user sessions securely.

```js
userSchema.methods.generateRefreshToken = function () {
  return jsonwebtoken.sign({
    _id: this._id,
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  });
};
```

#### Explanation:

- The payload here only includes `_id`, since the Refresh Token’s purpose is solely to validate that the user can request a new Access Token.
    
- `REFRESH_TOKEN_SECRET` is another secure string (different from the access secret) for signing.
    
- `expiresIn` is longer (e.g., 7 days, 30 days) to allow longer sessions.
    

### Why Two Tokens?

- **Security**: If an Access Token is compromised, its short lifespan limits damage. Refresh Tokens, being long-lived, are stored more securely (e.g., in `httpOnly` cookies).
    
- **Efficiency**: The server remains stateless. You don’t need to store sessions; instead, the JWT itself carries all the information.
    
- **User Experience**: Users don’t have to log in every time the Access Token expires. The client can use the Refresh Token to get a new Access Token automatically.
    

So, the **Access Token** provides short-term authentication for quick access to resources, while the **Refresh Token** allows for seamless session continuation by providing a new Access Token when the old one expires. This separation minimizes security risks and reduces the need for constant re-authentication, enhancing both efficiency and protection.

 **JWT** (JSON Web Token) is a standardized format for securely transmitting information between a client and a server. It's not a type of token itself but a way to structure and encode the data within **Access Tokens** and **Refresh Tokens**.


Together, these tokens provide a secure and scalable way to manage user authentication in modern web applications.

---

// Below is optional stuff
# Error middleware

## error.middleware.js - Explanation

### ✨ Purpose:

This middleware handles **errors** thrown in the application by:
- Catching any error passed through the `next(err)` function.
- Formatting the error into a proper API response.
- Using the custom `ApiError` class to make all error responses consistent.

---

### ⚡ The Code Flow:

#### 1. Middleware Signature

```js
const errorHandler = (err, req, res, next) => {
```

- It's a standard **Express error-handling middleware** because it has 4 arguments.
- Automatically catches errors passed via `next(err)`.
#### 2. Determine the Error Type

```js
let error = err;
if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500;
    // [BUG: statusCode is unused and should be assigned outside this block]
}
```

- Checks if the error is already an `ApiError`.
    
- If not, assigns a status code based on:
    
    - `mongoose.Error` → 400
        
    - Any other error → 500
        

#### 3. Wrap Error in ApiError

```js
error = new ApiError(statusCode, message, error?.ApiError.errors || [], err.stack);
```

- Ensures any unexpected error is wrapped in a structured format.
    

#### 4. Construct JSON Response

```js
const response = {
  ...error,
  message: error.message,
  ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
};
```

- Spreads the `error` object fields.
    
- Includes the `stack` only in development for debugging.
    

#### 5. Send the Response

```js
return res.status(error.statusCode).json(response);
```

- Sends the structured error response to the client.
    

---

## 🔧 Fix Needed in Code

There is a small bug:

- `statusCode` is declared inside the `if` block but used outside.
    
- It should be declared in the outer scope before being used in `new ApiError()`.
    

---

## 🔒 What is `ApiError`?

It's a custom error class to give a consistent structure to your API errors.

```js
class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.message = message;
    this.success = false;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

- Helps your frontend team know what to expect.
    
- Useful for centralized error handling and logging.
    

---

## 🌍 Real Example in Asobi

When a user tries to register with an existing email:

- `throw new ApiError(409, "Username or email already exists")`
    
- This is caught in the middleware and returned as:
    

```json
{
  "statusCode": 409,
  "message": "Username or email already exists",
  "success": false,
  "data": null
}
```

---

Use this middleware at the **end** of your route declarations:

```js
app.use(errorHandler);
```

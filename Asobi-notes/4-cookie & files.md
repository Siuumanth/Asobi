**Express.js Cookies - Notes**

---
### **What are Cookies?**

- Cookies are small pieces of data stored on the client-side (browser) and sent to the server with every HTTP request.
    
- They help maintain stateful information in a stateless HTTP protocol.

---

### **Why are Cookies Used?**

- **Session management**: To track logged-in users across pages.
- **Personalization**: Save user preferences like language, theme, etc.
- **Tracking**: For analytics and user behavior tracking.
    
---

### **Working of Cookies in Express.js**

- Cookies are sent by the server via the `Set-Cookie` header.
- On subsequent requests, the browser sends them back in the `Cookie` header.
- On the server, we can access, create, and delete cookies using middleware like `cookie-parser`.

---

### **cookie-parser Middleware**

- `cookie-parser` is a middleware for Express to parse and manage cookies easily.
- It parses `Cookie` header and populates `req.cookies` and `req.signedCookies`.

**Installation**

```bash
npm install cookie-parser
```

**Usage**

```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cookieParser('your_secret_key')); // Optional secret for signed cookies

// Set a cookie
app.get('/set-cookie', (req, res) => {
  res.cookie('username', 'john_doe', { maxAge: 900000, httpOnly: true });
  res.send('Cookie has been set');
});

// Read a cookie
app.get('/get-cookie', (req, res) => {
  const user = req.cookies.username;
  res.send(`Username is ${user}`);
});

// Clear a cookie
app.get('/clear-cookie', (req, res) => {
  res.clearCookie('username');
  res.send('Cookie cleared');
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

### **Cookie Options (Common)**

- `maxAge`: Duration in ms before the cookie expires.
- `httpOnly`: Prevents JavaScript access (security).
- `secure`: Ensures cookie is sent over HTTPS only.
- `signed`: Signs the cookie to prevent tampering.

---
### **Summary**
- Cookies are vital for maintaining state in web apps.
- `cookie-parser` simplifies cookie handling in Express.
- Always use options like `httpOnly`, `secure`, and `signed` for better security.

---

# File handling with `multer`:

### **What is Multer?**
- Multer is a middleware for handling `multipart/form-data`, primarily used for uploading files.
- It makes it easy to store and manage files from form submissions in Express apps.
    
---
### **Why Use Multer?**

- Express doesn't handle file uploads by default.
- Multer provides tools to parse file data and attach it to `req.file` or `req.files`.
- Commonly used for uploading profile pictures, documents, etc.

---
### **Installation**

```bash
npm install multer
```

---
### **Basic Usage Example**

```javascript
import multer from "multer"

// Step 1: Define custom storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specifies the folder where uploaded files will be stored
    cb(null, '/public/temp');
  },
  filename: function (req, file, cb) {
    // Generates a unique filename using field name and timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});
  
// Step 2: Create an upload middleware with the custom storage
const upload = multer({ storage: storage });
// Now, 'upload' can be used in routes like:
// app.post('/upload', upload.single('image'), (req, res) => { ... });
```


## Multer File Upload – Code Explanation
### ✅ 1. Import Multer

`import multer from "multer";`
- Imports the `multer` library which is used to handle file uploads in Express apps.

---
### ✅ 2. Define Custom Storage
```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/public/temp');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});
```
``
##### 🔸 `multer.diskStorage({...})`
- This sets up a **custom file storage configuration**.
##### 🔹 `destination` function
- **Purpose**: Specifies the directory where files should be stored.
- `cb(null, '/public/temp')`: Tells Multer to store files in `/public/temp`.
##### 🔹 `filename` function
- **Purpose**: Generates a **unique filename** for each uploaded file.
- `file.fieldname`: Name of the form field (e.g., `"image"`).
- `Date.now()` + random number: Ensures the filename is unique.
    
---
##### ✅ 3. Create the Upload Middleware
`const upload = multer({ storage: storage });`
- This creates a middleware function `upload` using the custom storage settings.
- You can now use this `upload` to handle file uploads in routes.
### **Common Multer Methods**

- `upload.single(fieldname)`: Uploads a single file.
- `upload.array(fieldname, maxCount)`: Uploads multiple files from the same field.
- `upload.fields([{ name, maxCount }])`: Uploads multiple fields with different names.
    
---
### **File Filtering and Limits**

```javascript
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 }, // 1 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
  }
});
```

---

### **Summary**

- Multer is essential for file uploads in Express.
- It provides control over where and how files are stored.
- Always validate file type and size for security and reliability.


---

# Uploading files in cloudinary

1. Get the cloud name, API key and API secret in cloudinary website and store it in ENV
2.  Copy the code:
```javascript
import { v2 as cloudinary } from 'cloudinary';
require('dotenv').config();
import fs from 'fs';

//configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

//Whenever we upload stuff thru multer, we get a local file path as returning, so we pass that in this function
const uploadOnCloudinary = async(localFilePath) => {
    try {
        if(!localFilePath) return null;
        //uploading to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            // this auto detects file type
        }
    );
    console.log("File uploaded on cloudinary", response.url);
    // once the file is uplaoded we would like to delete it from our servers, in node
    fs.unlinkSync(localFilePath);
    return response;
    } catch (error) {
        // if some error happens we will abort uploading and delete file using unlink func
        fs.unlinkSync(localFilePath);
        throw error;
    }
}
```

The above uploads to the server.
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

// Now, 'upload' can be used in routes like:
// app.post('/upload', upload.single('image'), (req, res) => { ... });


// we will export our upload middleware
export const upload = multer({
    storage
})
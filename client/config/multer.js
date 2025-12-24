import multer from 'multer';
import path from 'path'
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// // These lines will give you the equivalent of `__dirname` in an ES6 module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// // Set storage engine
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(__dirname, '../public/uploads/');
//     // Ensure the directory exists
//     fs.mkdirSync(uploadPath, { recursive: true });

//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const sanitizedFilename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname).toLowerCase();
//     cb(null, sanitizedFilename);
//   }
// });

// File filter to allow only certain file types
// const fileFilter = (req, file, cb) => {
//   const filetypes = /jpeg|jpg|png|gif/;
//   const mimetype = filetypes.test(file.mimetype);
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only images are allowed!'), false);
//   }
// };

// // Initialize Multer with the storage engine and file filter
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
//   fileFilter: fileFilter
// });

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};
const storage = multer.memoryStorage(); // Use memory storage to get buffer directly
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: fileFilter
});
export default upload;
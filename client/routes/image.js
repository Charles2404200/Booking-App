import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const router = express.Router();

// Initialize Cloudflare R2 client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;



// Test the S3 client connection
(async () => {
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    console.log('S3 Client is connected successfully:', data);
  } catch (error) {
    console.error('Failed to connect to S3:', error.message, error.stack);
  }
})();

// Multer setup to use memory storage
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

const storageMulter = multer.memoryStorage();
const upload = multer({
  storage: storageMulter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: fileFilter,
});

router.post('/update-img', upload.single('imageFile'), async (req, res) => {
    const userImg = req.query.userImg;
    console.log('Existing user image URL:', userImg);

    try {
        // Always attempt to delete the old image if a valid userImg is provided
        if (userImg && userImg.startsWith(`https://pub-93b162f2c2324969b45e28374787425b.r2.dev/`)) {
            const fileName = userImg.split('/').pop();
            console.log(`Attempting to delete old image: ${fileName}`);

            try {
                await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileName }));
                console.log('Deleted old image from Cloudflare R2');
            } catch (error) {
                console.error('Failed to delete image from Cloudflare R2:', error.message, error.stack);
            }
        }

        // Check if an imageFile is provided for upload
        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const params = {
                Bucket: bucketName,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read', // Make the file publicly accessible
            };
            const command = new PutObjectCommand(params);
            await s3.send(command);

            const publicUrl = `https://pub-93b162f2c2324969b45e28374787425b.r2.dev/${fileName}`;
            console.log('New image uploaded successfully:', publicUrl);

            return res.status(200).json({ message: 'Image uploaded successfully!', fileUrl: publicUrl });
        } else {
            return res.status(200).json({ message: 'No new image uploaded, old image deleted if necessary.' });
        }
    } catch (err) {
        console.error('Error occurred:', err.message, err.stack);
        res.status(500).send('Server error.');
    }
});
///Post
router.post('/post-img', upload.single('imageFile'), async (req, res) => {
    const postImg = req.query.postImg;
    console.log('postImg:', postImg);

    try {
        // Always check for the old image to delete
        if (postImg && postImg.startsWith(`https://pub-93b162f2c2324969b45e28374787425b.r2.dev/`)) {
            const fileName = postImg.split('/').pop();
            console.log(`Attempting to delete old image: ${fileName}`);

            try {
                await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileName }));
                console.log('Deleted old image from Cloudflare R2');
            } catch (error) {
                console.error('Failed to delete image from Cloudflare R2:', error.message, error.stack);
            }
        }

        // Check if an imageFile is provided
        if (req.file) {
            // If an imageFile is provided, continue with the upload
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const params = {
                Bucket: bucketName,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read',
            };
            const command = new PutObjectCommand(params);
            await s3.send(command);

            const publicUrl = `https://pub-93b162f2c2324969b45e28374787425b.r2.dev/${fileName}`;
            console.log('New image uploaded successfully:', publicUrl);

            return res.status(200).json({ message: 'Image uploaded successfully!', fileUrl: publicUrl });
        } else {
            return res.status(200).json({ message: 'No new image uploaded, old image deleted if necessary.' });
        }
    } catch (err) {
        console.error('Error occurred:', err.message, err.stack);
        res.status(500).send('Server error.');
    }
});
export default router;
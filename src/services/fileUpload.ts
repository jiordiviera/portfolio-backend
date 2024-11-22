import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        public_id: (req, file) => Date.now() + '-' + file.originalname,
    },
});

export const upload = multer({ storage: storage });

export const uploadToCloudinary = (file: Express.Multer.File): Promise<string> => {
    console.log('Fichier reçu:', file); // Affiche les métadonnées du fichier
    console.log('Buffer du fichier:', file.buffer ? file.buffer.length : 0);
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'blog_posts' },
            (error, result) => {
                if (error) {
                    console.error('Upload error:', error);
                    reject(error);
                } else if (result) {
                    console.log('Upload successful:', result);
                    resolve(result.secure_url);
                } else {
                    reject(new Error('Upload failed: No result returned'));
                }
            }
        );

        if (file.buffer && file.buffer.length > 0) {
            uploadStream.end(file.buffer);
        } else {
            reject(new Error('Le fichier est vide ou invalide'));
        }
    });
};

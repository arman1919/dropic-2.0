const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Check for required environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.error('FATAL ERROR: Missing Cloudinary environment variables:', missingEnvVars.join(', '));
  // Exit gracefully if config is missing
  // In a real app, you might not want to process.exit(1) here, but for debugging it's clear.
} else {
  console.log('All Cloudinary environment variables are loaded.');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req) => `dropic/${req.user.userId}`, // Folder name on Cloudinary
    // Сохраняем оригинальный формат, Cloudinary определит автоматически
    // Убираем явное указание 'auto', т.к. это ведёт к ошибке «Invalid extension in transformation: auto»
    public_id: (req, file) => uuidv4(), // use uuid for public_id
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

// GET /api/media - list user's media
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ media: user.media || [] });
  } catch (err) {
    console.error('Error fetching media:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// POST /api/media/upload - upload multiple images to Cloudinary
// Переписано с явной обработкой ошибок Multer/Cloudinary, чтобы клиент всегда получал JSON
router.post('/upload', auth, (req, res) => {
  // Запускаем Multer внутри колбэка, чтобы можно было перехватить ошибку
  upload.array('files', 20)(req, res, async (err) => {
    if (err) {
      console.error('Multer/Cloudinary upload error:', err);
      return res.status(500).json({
        message: 'Ошибка при загрузке файлов',
        error: err.message || err,
      });
    }

    try {
      const user = await User.findOne({ userId: req.user.userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const uploaded = (req.files || []).map((file) => ({
        photoId: file.public_id,
        publicId: file.public_id,
        filename: file.filename,
        originalName: file.originalname,
        url: file.path,
        secureUrl: file.secure_url,
      }));

      user.media.push(...uploaded);
      await user.save();

      res.status(201).json({ uploaded });
    } catch (error) {
      console.error('--- UPLOAD ROUTE ERROR ---');
      console.error(error);
      res.status(500).json({
        message: 'Ошибка сервера при загрузке',
        error: error.message,
      });
    }
  });
});

// DELETE /api/media/:photoId - delete one photo from Cloudinary and DB
router.delete('/:photoId', auth, async (req, res) => {
  const { photoId } = req.params; // This is now the public_id
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const photo = user.media.find((p) => p.photoId === photoId);
    if (!photo) return res.status(404).json({ message: 'File not found' });

    // If photo has a publicId, it's on Cloudinary, so delete it there
    if (photo.publicId) {
      await cloudinary.uploader.destroy(photo.publicId);
    } else {
      console.log(`Skipping Cloudinary deletion for photoId ${photoId} as it has no publicId.`);
    }

    // Remove from user's media array
    user.media = user.media.filter((p) => p.photoId !== photoId);
    await user.save();

    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;

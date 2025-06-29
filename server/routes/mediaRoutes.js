const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Ensure uploads directory exists
const baseUploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(baseUploadsDir)) {
  fs.mkdirSync(baseUploadsDir);
}

// Multer storage that places files under uploads/<userId>
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userDir = path.join(baseUploadsDir, req.user.userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({ storage });

const router = express.Router();

// GET /api/media - list user's media
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Ensure URLs include server origin
    const serverBase = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5001}`;
    const mediaWithFullUrl = (user.media || []).map((m) => ({
      ...m,
      url: m.url.startsWith('http') ? m.url : `${serverBase}${m.url}`,
    }));
    res.json({ media: mediaWithFullUrl });
  } catch (err) {
    console.error('Error fetching media:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// POST /api/media/upload - upload multiple images
router.post('/upload', auth, upload.array('files', 20), async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const serverBase = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5001}`;

    const uploaded = req.files.map((file) => {
      const photo = {
        photoId: uuidv4(),
        filename: file.filename,
        originalName: file.originalname,
        url: `${serverBase}/uploads/${req.user.userId}/${file.filename}`,
        path: file.path,
      };
      return photo;
    });

    user.media.push(...uploaded);
    await user.save();

    res.status(201).json({ uploaded });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// DELETE /api/media/:photoId - delete one photo
router.delete('/:photoId', auth, async (req, res) => {
  const { photoId } = req.params;
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const photo = user.media.find((p) => p.photoId === photoId);
    if (!photo) return res.status(404).json({ message: 'File not found' });

    // remove file from fs
    if (photo.path && fs.existsSync(photo.path)) {
      fs.unlinkSync(photo.path);
    }

    // remove from array
    user.media = user.media.filter((p) => p.photoId !== photoId);
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Delete media error:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;

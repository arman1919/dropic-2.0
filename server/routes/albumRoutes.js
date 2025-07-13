const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Album = require('../models/Album');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/albums  — список альбомов текущего пользователя
router.get('/', auth, async (req, res) => {
  try {
    const albums = await Album.find({ userId: req.user.userId }).lean();

    const formatted = albums.map((album) => ({
      _id: album._id,
      albumId: album.albumId,
      title: album.title,
      createdAt: album.createdAt,
      photoCount: album.photos?.length || 0,
      deleteToken: album.deleteToken,
    }));

    res.json({ albums: formatted });
  } catch (err) {
    console.error('Ошибка при получении альбомов:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// POST /api/albums  — создать новый альбом (минимальная реализация)
router.post('/', auth, async (req, res) => {
  try {
    const { title = 'Untitled Album' } = req.body;
    const newAlbum = new Album({
      albumId: uuidv4(),
      userId: req.user.userId,
      title,
      deleteToken: uuidv4(),
      photos: [],
    });

    await newAlbum.save();

    res.status(201).json({
      albumId: newAlbum.albumId,
      deleteToken: newAlbum.deleteToken,
    });
  } catch (err) {
    console.error('Ошибка при создании альбома:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// DELETE /api/albums/:albumId?token=<deleteToken>
router.delete('/:albumId', auth, async (req, res) => {
  const { albumId } = req.params;
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Token query param required' });
  }

  try {
    const album = await Album.findOne({ albumId, userId: req.user.userId });
    if (!album) {
      return res.status(404).json({ message: 'Альбом не найден' });
    }

    if (album.deleteToken !== token) {
      return res.status(403).json({ message: 'Неверный токен удаления' });
    }

    await Album.deleteOne({ _id: album._id });

    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка при удалении альбома:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// GET /api/albums/:albumId – получить один альбом
router.get('/:albumId', auth, async (req, res) => {
  const { albumId } = req.params;
  try {
    const album = await Album.findOne({ albumId, userId: req.user.userId }).lean();
    if (!album) return res.status(404).json({ message: 'Альбом не найден' });
    res.json({ album });
  } catch (err) {
    console.error('Album fetch error:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// PUT /api/albums/:albumId – обновить название и/или список фотоIds
router.put('/:albumId', auth, async (req, res) => {
  const { albumId } = req.params;
  const { title, photoIds, description, photos } = req.body;
  try {
    const album = await Album.findOne({ albumId, userId: req.user.userId });
    if (!album) return res.status(404).json({ message: 'Альбом не найден' });

    if (title !== undefined) album.title = title;
    if (description !== undefined) album.description = description;

    // Если изменился состав фото — пересобираем массив
    if (Array.isArray(photoIds)) {
      const user = await require('../models/User').findOne({ userId: req.user.userId }).lean();
      // Строим карту идентификаторов -> медиа, чтобы покрыть разные варианты photoId
      const mediaMap = new Map();
      (user.media || []).forEach((p) => {
        if (p.photoId) mediaMap.set(p.photoId, p);
        if (p.publicId) mediaMap.set(p.publicId, p);
        if (p.filename) {
          mediaMap.set(p.filename, p);
          const noExt = p.filename.replace(/\.[^/.]+$/, '');
          mediaMap.set(noExt, p);
        }
      });
      // Сохраняем пользовательские свойства, если они уже были у фото
      const oldPhotosMap = new Map((album.photos || []).map(p => [p.photoId, p]));
      album.photos = photoIds.map((id) => {
        const fromMedia = mediaMap.get(id);
        if (!fromMedia) {
          console.warn(`Media not found for photoId ${id}, skipping`);
          return null; // будет отфильтровано
        }
        const old = oldPhotosMap.get(id) || {};
                return {
          ...fromMedia,
          photoId: fromMedia.photoId || id,
          description: old.description ?? fromMedia.description,
          description_hidden: old.description_hidden ?? fromMedia.description_hidden,
          date: old.date ?? fromMedia.date,
          date_hidden: old.date_hidden ?? fromMedia.date_hidden,
        };
      }).filter(Boolean);
    }

    // Обновляем свойства фото (description, date и т.д.)
    if (Array.isArray(photos)) {
      album.photos = album.photos.map((photo) => {
        const updated = photos.find((p) => p.photoId === photo.photoId);
        if (updated) {
          return {
            ...photo,
            description: updated.description ?? photo.description,
            description_hidden: updated.description_hidden ?? photo.description_hidden,
            date: updated.date ?? photo.date,
            date_hidden: updated.date_hidden ?? photo.date_hidden,
          };
        }
        return photo;
      });
    }

    await album.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Album update error:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// GET /api/albums/:albumId/public  — публичные данные без авторизации
router.get('/:albumId/public', async (req, res) => {
  const { albumId } = req.params;
  try {
    const album = await Album.findOne({ albumId }).lean();
    if (!album) return res.status(404).json({ message: 'Альбом не найден' });

    // ВРЕМЕННЫЙ ЛОГ для отладки
    // console.log('DEBUG album.photos:', JSON.stringify(album.photos, null, 2));

    // Отдаём только необходимые поля
    const images = (album.photos || []).map(({ photoId, url, description, date, description_hidden, date_hidden }) => ({
      photoId,
      url,
      description,
      date,
      description_hidden,
      date_hidden,
    }));

    res.json({
      albumTitle: album.title,
      description: album.description,
      images,
      options: album.options || {},
    });
  } catch (err) {
    console.error('Public album fetch error:', err.message);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;

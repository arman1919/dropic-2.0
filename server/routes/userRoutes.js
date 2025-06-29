const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Убедитесь, что путь к модели верный

const router = express.Router();

// @route   POST /api/users/register
// @desc    Регистрация нового пользователя
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Проверка на существующего пользователя по email или username
    let user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      if (user.email === email) {
        return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
      }
      if (user.username === username) {
        return res.status(409).json({ message: 'Пользователь с таким именем уже существует' });
      }
    }

    // Создание нового пользователя
    user = new User({
      userId: uuidv4(),
      username,
      email,
      passwordHash: password,
    });

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);

    await user.save();

    // Создание токена
    const payload = {
      user: {
        userId: user.userId,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ success: true, token });
      }
    );
  } catch (error) {
    console.error('Ошибка при регистрации:', error.message);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).send('Ошибка сервера');
  }
});

// @route   POST /api/users/login
// @desc    Аутентификация пользователя и получение токена
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    const payload = {
      user: {
        userId: user.userId,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Ошибка при входе:', error.message);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;

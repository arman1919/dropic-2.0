const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars from .env.local
dotenv.config({ path: require('path').resolve(__dirname, '../.env.local') });

// Connect to database
connectDB();

const app = express();

// Body Parser Middleware
app.use(express.json());

// Enable CORS
app.use(cors());

// Define Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/albums', require('./routes/albumRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));

// Статически раздаём загруженные файлы
app.use('/uploads', express.static(require('path').resolve(__dirname, 'uploads')));


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

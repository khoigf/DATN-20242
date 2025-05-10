const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const tagRoutes = require('./routes/tagRoutes');
const searchRoutes = require('./routes/searchRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commentRoutes = require('./routes/commentRoutes');

dotenv.config(); 
connectDB();

const app = express();
app.use(express.json());

const path = require('path');

// Serve thư mục uploads cho client
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
    origin: '*'
}));

const compression = require('compression');
app.use(compression());

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
// app.use('/api/favorites', favoriteRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

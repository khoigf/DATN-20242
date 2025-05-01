const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/userModel');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Tạo admin nếu chưa tồn tại
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const existingAdmin = await User.findOne({ role: 'admin' });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const newAdmin = new User({
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isVerified: true
            });
            await newAdmin.save();
            console.log(`✅ Admin account created: ${adminEmail}`);
        } else {
            console.log(`ℹ️ Admin account already exists: ${existingAdmin.email}`);
        }

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;

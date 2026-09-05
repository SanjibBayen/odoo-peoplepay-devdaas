import dotenv from 'dotenv';
import { sequelize } from './src/config/database.js';
import models from './src/models/index.js';
import { hashPassword } from './src/utils/password.utils.js';

dotenv.config();

const { User, Role } = models;

const seedAdmin = async() => {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const hashedPassword = await hashPassword('Admin@123');
        console.log('Password hashed');

        // Delete existing admin
        await User.destroy({
            where: { email: 'sanjibbayen11@gmail.com' },
            force: true
        });
        console.log('Old admin removed (if existed)');

        // Create admin
        const user = await User.create({
            email: 'sanjibbayen11@gmail.com',
            passwordHash: hashedPassword,
            firstName: 'System',
            lastName: 'Administrator',
            isActive: true,
        });
        console.log('Admin created');

        // Assign ADMIN role
        const adminRole = await Role.findOne({ where: { code: 'ADMIN' } });
        if (adminRole) {
            await user.addRole(adminRole);
            console.log('ADMIN role assigned');
        }

        console.log('-----------------------------------');
        console.log('Admin ready!');
        console.log('Email: sanjibbayen11@gmail.com');
        console.log('Password: Admin@123');
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

seedAdmin();
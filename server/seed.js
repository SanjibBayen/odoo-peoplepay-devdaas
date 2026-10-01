import dotenv from 'dotenv';
import { sequelize } from './src/config/database.js';
import models from './src/models/index.js';
import { hashPassword } from './src/utils/password.utils.js';

dotenv.config();

const { User, Role } = models;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ERROR: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in your .env file');
    process.exit(1);
}

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        // Ensure tables exist
        await sequelize.sync({ force: false });
        console.log('Tables synchronized');

        const hashedPassword = await hashPassword(ADMIN_PASSWORD);
        console.log('Password hashed');

        // Delete existing admin with this email
        await User.destroy({
            where: { email: ADMIN_EMAIL },
            force: true,
        });
        console.log('Old admin removed (if existed)');

        // Create admin
        const user = await User.create({
            email: ADMIN_EMAIL,
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
        } else {
            console.warn('WARNING: ADMIN role not found in roles table. Run the full seed (seedData.js) first.');
        }

        console.log('-----------------------------------');
        console.log('Admin ready!');
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

seedAdmin();

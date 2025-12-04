import { userModel } from './src/models/userModel.js';
import { initDatabase } from './src/models/db.js';

try {
    initDatabase();
    console.log('Testing create...');
    const email = `test_${Date.now()}@example.com`;
    const userId = userModel.create({
        email,
        name: 'New User',
        role: 'student',
        googleId: `google_${Date.now()}`
    });
    console.log('User created with ID:', userId);

    const user = userModel.findById(userId);
    console.log('User retrieved:', user);
} catch (error) {
    console.error('Error:', error);
}

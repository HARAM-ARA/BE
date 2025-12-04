import { userModel } from './src/models/userModel.js';
import { initDatabase } from './src/models/db.js';

try {
    initDatabase();
    console.log('Testing findByEmail...');
    const user = userModel.findByEmail('test@example.com');
    console.log('User found:', user);
} catch (error) {
    console.error('Error:', error);
}

import { stdService } from './src/services/stdService.js';
import { boardModel } from './src/models/boardModel.js';
import { teamModel } from './src/models/teamModel.js';
import { userModel } from './src/models/userModel.js';
import { initDatabase, closeDatabase } from './src/models/db.js';

async function runTest() {
    console.log('Starting verification test...');
    initDatabase();
    boardModel.initBoard();

    try {
        // 1. Setup Test Data
        console.log('Setting up test data...');

        // Create test teams
        const team1Id = teamModel.create({ teamNumber: 998, classNumber: 99, name: 'Test Team 1' });
        const team2Id = teamModel.create({ teamNumber: 999, classNumber: 99, name: 'Test Team 2' });

        // Create test user and assign to team 1
        const userId = userModel.create({
            email: 'test@example.com',
            name: 'Test Student',
            role: 'student',
            googleId: 'test_google_id'
        });
        teamModel.assignStudentToTeam(userId, team1Id);

        const user = { id: userId, role: 'student' };

        // 2. Test Pull Card
        console.log('\nTesting Pull Card...');

        // Initial credit check
        let team1 = teamModel.findById(team1Id);
        console.log(`Initial Team 1 Credit: ${team1.team_credit}`);

        // Pull a card
        const cardNumber = 1;
        console.log(`Pulling card ${cardNumber}...`);
        const result = await stdService.pullCard(user, cardNumber);

        console.log('Result:', result);

        // Verify credit change
        team1 = teamModel.findById(team1Id);
        console.log(`Post-pull Team 1 Credit: ${team1.team_credit}`);

        // Verify card status
        const card = boardModel.getCardStatus(cardNumber);
        console.log(`Card ${cardNumber} status:`, card);

        if (card.is_pulled && card.pulled_by_team_id === team1Id) {
            console.log('SUCCESS: Card marked as pulled correctly.');
        } else {
            console.error('FAILURE: Card status incorrect.');
        }

        // 3. Test Insufficient Credit
        console.log('\nTesting Insufficient Credit...');
        // Manually set credit to 0
        const db = initDatabase();
        db.prepare('UPDATE teams SET team_credit = 0 WHERE id = ?').run(team1Id);

        try {
            await stdService.pullCard(user, 2);
            console.error('FAILURE: Should have thrown error for insufficient credit.');
        } catch (e) {
            if (e.code === 'PAYMENT_REQUIRED') {
                console.log('SUCCESS: Correctly caught insufficient credit error.');
            } else {
                console.error('FAILURE: Caught unexpected error:', e);
            }
        }

        // 4. Test Already Pulled
        console.log('\nTesting Already Pulled...');
        // Give credit back
        db.prepare('UPDATE teams SET team_credit = 3000 WHERE id = ?').run(team1Id);

        try {
            await stdService.pullCard(user, 1); // Card 1 was already pulled
            console.error('FAILURE: Should have thrown error for already pulled card.');
        } catch (e) {
            if (e.code === 'ALREADY_PROCESSED') {
                console.log('SUCCESS: Correctly caught already processed error.');
            } else {
                console.error('FAILURE: Caught unexpected error:', e);
            }
        }

    } catch (error) {
        console.error('Test failed with error:', error);
    } finally {
        // Cleanup (Optional, but good for repeatability if we deleted data)
        // For now, just close DB
        closeDatabase();
        console.log('\nTest finished.');
    }
}

runTest();

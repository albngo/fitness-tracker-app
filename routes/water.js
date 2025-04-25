import express from 'express';
const router = express.Router();
import db from '../config/db.js';

// Middleware to ensure the user is authenticated
router.use((req, res, next) => {
    console.log('Session user:', req.session.user); // Debug session user
    if (!req.session.user || !req.session.user.id) {
        console.error('No user ID found in session. Redirecting to login.');
        return res.redirect('/users/login');
    }
    req.user = req.session.user; // Attach session user to req.user
    next();
});

// Route to display water tracker page with logs and form
router.get('/', (req, res) => {
    const userId = req.session.user.id; // Get the logged-in user ID from the session

    if (!userId) {
        console.log('No user ID found in session. Redirecting to login.');
        return res.redirect('/users/login');
    }

    const sql = 'SELECT * FROM water_logs WHERE user_id = ? ORDER BY date DESC';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching water logs:', err);
            return res.status(500).send('Error fetching water logs');
        }

        console.log('Fetched water logs:', results);
        res.render('water', { waterLogs: results }); // Pass logs to the template
    });
});

// Route to log water intake
router.post('/log', (req, res) => {
    const { amount_ml } = req.body;
    const userId = req.session.user.id;

    if (!userId) {
        console.log('User not logged in. Redirecting to login.');
        return res.redirect('/users/login');
    }

    const sql = 'INSERT INTO water_logs (user_id, date, amount_ml) VALUES (?, CURDATE(), ?)';
    db.query(sql, [userId, amount_ml], (err, result) => {
        if (err) {
            console.error('Error logging water intake:', err);
            return res.status(500).send('Something went wrong with logging the water intake!');
        }

        console.log('Water intake logged successfully:', result);
        res.redirect('/water'); // Redirect back to the water tracker page
    });
});

export default router;

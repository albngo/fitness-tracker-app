import express from 'express';
const router = express.Router();
import db from '../config/db.js'; // Adjust path if necessary

// Middleware to ensure the user is authenticated
router.use((req, res, next) => {
    console.log('Session user:', req.session.user); // Debug session user
    if (!req.session.user || !req.session.user.id) {
        console.error('User is not logged in');
        return res.redirect('/users/login'); // Adjusted redirect path
    }
    req.user = req.session.user; // Attach session user to req.user
    next();
});

// Route to render the sleep tracking page
router.get('/', (req, res) => {
    const userId = req.user.id;

    // Fetch sleep logs for the user from the database
    db.query('SELECT * FROM sleep_logs WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error fetching sleep logs:', err);
            return res.status(500).send('Error fetching sleep logs');
        }

        console.log('Fetched sleep logs:', results);

        // Pass the sleep logs to the template
        res.render('sleep', { sleepLogs: results });
    });
});

    // Route to handle sleep log form submission
    router.post('/log', (req, res) => {
        const { sleep_duration_minutes, sleep_quality } = req.body;
        const userId = req.user.id;
    
        // Validate the input
        if (
            !sleep_duration_minutes ||
            isNaN(sleep_duration_minutes) ||
            Number(sleep_duration_minutes) <= 0 ||
            Number(sleep_duration_minutes) > 1440 // Assuming max 24 hours in minutes
        ) {
            req.flash('error', 'Please enter a valid sleep duration and select a valid sleep quality.');
            return res.redirect('/sleep');
        }

        // Insert the sleep log into the database
        const query = 'INSERT INTO sleep_logs (user_id, date, sleep_duration_minutes, sleep_quality) VALUES (?, CURDATE(), ?, ?)';
        db.query(query, [userId, sleep_duration_minutes, sleep_quality], (err, result) => {
            if (err) {
                console.error('Error inserting sleep log:', err);
                return res.status(500).send('Error logging sleep data');
            }
            req.flash('success', 'Sleep data logged successfully');
            console.log('Sleep data logged successfully:', result);
            // Redirect to the sleep page after successful submission
            res.redirect('/sleep');
        });
});

export default router;

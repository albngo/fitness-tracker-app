import express from 'express';
const router = express.Router();
import db from '../config/db.js'; // Adjust path if necessary

// Middleware to ensure the user is authenticated
router.use((req, res, next) => {
    if (!req.session.user || !req.session.user.id) {
        console.log('User is not logged in');
        return res.redirect('/users/login'); // Redirect to login if not authenticated
    }
    req.user = req.session.user; // Attach session user to req.user
    next();
});

// Route to render the profile page
router.get('/', (req, res) => {
    const userId = req.user.id;

    // Fetch user data from the database
    const sql = 'SELECT username, email, profileIcon FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user profile:', err);
            return res.status(500).send('Error fetching user profile');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];

        const icons = [
            'avatarblack.png',
            'avatarblue.png',
            'avatargreen.png',
            'avatarorange.png',
            'avatarred.png',
            'avataryellow.png'
        ];

        // Render the profile page with user data
        res.render('profile', { user,icons });
    });
});

export default router;

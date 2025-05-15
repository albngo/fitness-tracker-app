import express from 'express';
import db from '../config/db.js';
const router = express.Router();

// Middleware to ensure the user is authenticated
router.use((req, res, next) => {
    if (!req.session.user || !req.session.user.id) {
        console.log('User is not logged in');
        return res.redirect('/users/login'); // Redirect to login if not authenticated
    }
    req.user = req.session.user; // Attach session user to req.user
    next();
});

// GET route for settings page
router.get('/', async (req, res) => {
    const userId = req.user.id;
    
    // Fetch current settings
    const sql = 'SELECT theme, font_pref FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user settings:', err);
            return res.status(500).send('Error loading settings');
        }

        const userSettings = results[0];
        res.render('settings', {
            user: req.user,
            theme: userSettings.theme || 'light',
            fontPref: userSettings.font_pref || 'normal'
        });
    });
});

/// POST route to update settings (theme and font preferences)
router.post('/update', (req, res) => {
    const { theme, fontPref } = req.body;
    const userId = req.user.id;

    const sql = 'UPDATE users SET theme = ?, font_pref = ? WHERE id = ?';
    db.query(sql, [theme, fontPref, userId], (err, result) => {
        if (err) {
            console.error('Error updating settings:', err);
            return res.status(500).send('Error updating settings');
        }

        req.flash('success', 'Settings updated successfully!');
        res.redirect('/settings'); // Redirect back to settings page
    });
});

// POST route for account deletion (handle separately from settings update)
router.post('/delete-account', (req, res) => {
    const userId = req.user.id;

    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting account:', err);
            return res.status(500).send('Error deleting account');
        }

        // Destroy session after account deletion
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Error logging out');
            }
            res.redirect('/'); // Redirect to homepage after account deletion
        });
    });
});

export default router;

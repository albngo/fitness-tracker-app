import express from 'express';
import bcrypt from 'bcrypt';
import db from '../config/db.js';
import validator from 'validator'; // For input validation and sanitisation

const router = express.Router();

// Route to render register page
router.get('/register', (req, res) => {
    res.render('register', { message: req.query.message || null });
});

// Route to handle registration form submission
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    // Trim inputs and validate
    if (!username?.trim() || !email?.trim() || !password?.trim()) {
        return res.redirect('/users/register?message=All fields are required');
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Validate username length and format
    if (!validator.isLength(trimmedUsername, { min: 3, max: 20 }) || !validator.isAlphanumeric(trimmedUsername, 'en-US', { ignore: '_' })) {
        return res.redirect('/users/register?message=Username must be 3-20 characters and can only contain letters, numbers, and underscores');
    }

    // Validate email format
    if (!validator.isEmail(trimmedEmail)) {
        return res.redirect('/users/register?message=Invalid email address');
    }

    // Validate password strength
    if (!validator.isStrongPassword(trimmedPassword, { minLength: 8, minNumbers: 1, minSymbols: 1, minUppercase: 1 })) {
        return res.redirect('/users/register?message=Password must be at least 8 characters long, include one uppercase letter, one number, and one special character');
    }

    // Check if email already exists
    const checkEmailSQL = 'SELECT * FROM users WHERE email = ?';
    db.query(checkEmailSQL, [trimmedEmail], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Something went wrong!');
        }

        if (results.length > 0) {
            return res.redirect('/users/register?message=Email already taken');
        }

        bcrypt.hash(trimmedPassword, 10, (err, hashedPassword) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Something went wrong!');
            }

            const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
            db.query(sql, [trimmedUsername, trimmedEmail, hashedPassword], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Something went wrong!');
                }

                res.redirect('/users/login?message=Account created successfully');
            });
        });
    });
});

// Route to render the login page
router.get('/login', (req, res) => {
    res.render('login', { message: req.query.message || null });
});

// Route to handle login logic
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Trim inputs and validate
    if (!email?.trim() || !password?.trim()) {
        return res.redirect('/users/login?message=All fields are required');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Validate email format
    if (!validator.isEmail(trimmedEmail)) {
        return res.redirect('/users/login?message=Invalid email address');
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [trimmedEmail], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Something went wrong!');
        }

        if (results.length === 0) {
            return res.redirect('/users/login?message=Invalid credentials');
        }

        const user = results[0];

        bcrypt.compare(trimmedPassword, user.password_hash, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Something went wrong!');
            }

            if (!isMatch) {
                return res.redirect('/users/login?message=Invalid credentials');
            }

            // Store user details in session
            req.session.user = { id: user.id, username: user.username, email: user.email };
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).send('Error saving session');
                }
                res.redirect('/');
            });
        });
    });
});

// Route to handle updating user details
router.post('/profile/update', (req, res) => {
    const { username, email, selected_icon } = req.body;
    const userId = req.session.user.id;

    if (!username || !email) {
        return res.redirect('/profile?message=All fields are required');
    }

    const trimmedUsername = validator.trim(username);
    const trimmedEmail = validator.trim(email).toLowerCase();
    const icon = selected_icon?.trim() || null;

    // Check if new email is already taken by another user
    const checkEmailSQL = 'SELECT id FROM users WHERE email = ? AND id != ?';
    db.query(checkEmailSQL, [trimmedEmail, userId], (err, results) => {
        if (err) {
            console.error('Error checking email uniqueness:', err);
            return res.status(500).send('Error checking email');
        }

        if (results.length > 0) {
            return res.redirect('/profile?message=Email already in use');
        }

        const updateSQL = 'UPDATE users SET username = ?, email = ?, profileIcon = ? WHERE id = ?';
        db.query(updateSQL, [trimmedUsername, trimmedEmail, icon, userId], (err) => {
            if (err) {
                console.error('Error updating user profile:', err);
                return res.status(500).send('Error updating profile');
            }

            // Update the session to reflect new values
            req.session.user.username = trimmedUsername;
            req.session.user.email = trimmedEmail;
            req.session.user.profileIcon = icon;

            res.redirect('/profile?message=Profile updated successfully');
        });
    });
});


// Route to handle logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }

        // Redirect to the homepage or login page after logging out
        res.redirect('/');
    });
});

export default router;

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
    const { username, email, password, profileIcon } = req.body;

    // Trim inputs and validate
    if (!username?.trim() || !email?.trim() || !password?.trim()) {
        req.flash('error', 'All fields are required');
        return res.redirect('/users/register');
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Validate username length and format
    if (!validator.isLength(trimmedUsername, { min: 3, max: 20 }) || !validator.isAlphanumeric(trimmedUsername, 'en-US', { ignore: '_' })) {
        req.flash('error', 'Username must be 3-20 characters and can only contain letters, numbers, and underscores');
        return res.redirect('/users/register?message=Username must be 3-20 characters and can only contain letters, numbers, and underscores');
    }

    // Validate email format
    if (!validator.isEmail(trimmedEmail)) {
        req.flash('error', 'Invalid email address');
        return res.redirect('/users/register');
    }

    // Validate password strength
    if (!validator.isStrongPassword(trimmedPassword, { minLength: 8, minNumbers: 1, minSymbols: 1, minUppercase: 1 })) {
        req.flash('error', 'Password must be at least 8 characters long, include one uppercase letter, one number, and one special character');
        return res.redirect('/users/register');
    }

    // Check if email already exists
    const checkEmailSQL = 'SELECT * FROM users WHERE email = ?';
    db.query(checkEmailSQL, [trimmedEmail], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Something went wrong!');
        }

        if (results.length > 0) {
            req.flash('error', 'Email already taken');
            return res.redirect('/users/register');
        }

        bcrypt.hash(trimmedPassword, 10, (err, hashedPassword) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Something went wrong!');
            }

            const sql = 'INSERT INTO users (username, email, password_hash, profileIcon) VALUES (?, ?, ?, ?)';
            db.query(sql, [trimmedUsername, trimmedEmail, hashedPassword, profileIcon], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Something went wrong!');
                }
                req.flash('success', 'Account created successfully');
                res.redirect('/users/login');
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
        req.flash('error', 'All fields are required');
        return res.redirect('/users/login');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Validate email format
    if (!validator.isEmail(trimmedEmail)) {
        req.flash('error', 'Invalid email address');
        return res.redirect('/users/login');
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [trimmedEmail], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Something went wrong!');
        }

        if (results.length === 0) {
            req.flash('error', 'Invalid credentials');
            return res.redirect('/users/login');
        }

        const user = results[0];

        bcrypt.compare(trimmedPassword, user.password_hash, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Something went wrong!');
            }

            if (!isMatch) {
                req.flash('error', 'Invalid credentials');
                return res.redirect('/users/login');
            }

            // Store user details in session
            req.session.user = { id: user.id, username: user.username, email: user.email, profileIcon: user.profileIcon};
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
        req.flash('error', 'All fields are required');
        return res.redirect('/profile');
    }

    const trimmedUsername = validator.trim(username);
    const trimmedEmail = validator.trim(email).toLowerCase();
    const icon = selected_icon?.trim() || null;

    // Validate username
    if (!validator.isLength(trimmedUsername, { min: 3, max: 20 }) ||
        !validator.isAlphanumeric(trimmedUsername, 'en-US', { ignore: '_' })) {
        req.flash('error', 'Username must be 3-20 characters and can only contain letters, numbers, and underscores');
        return res.redirect('/profile');
    }

    // Validate email
    if (!validator.isEmail(trimmedEmail)) {
        req.flash('error', 'Invalid email address');
        return res.redirect('/profile');
    }

    // Check if new email is already taken by another user
    const checkEmailSQL = 'SELECT id FROM users WHERE email = ? AND id != ?';
    db.query(checkEmailSQL, [trimmedEmail, userId], (err, results) => {
        if (err) {
            console.error('Error checking email uniqueness:', err);
            return res.status(500).send('Error checking email');
        }

        if (results.length > 0) {
            req.flash('error', 'Email already in use');
            return res.redirect('/profile');
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

            req.flash('success', 'Profile updated successfully');
            res.redirect('/profile');
        });
    });
});


// Route to handle logout
router.post('/logout', (req, res) => {

    req.flash('success', 'You have logged out');

    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }

        // Redirect to the homepage or login page after logging out
        res.redirect('/');
    });
});

// Password strength checking function
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Contains number
    if (/\d/.test(password)) strength += 25;
    
    // Contains letter
    if (/[a-zA-Z]/.test(password)) strength += 25;
    
    // Contains special character
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;

    return {
        score: strength,
        text: strength <= 25 ? 'Weak' : 
              strength <= 50 ? 'Fair' : 
              strength <= 75 ? 'Good' : 'Strong',
        color: strength <= 25 ? '#dc3545' : 
               strength <= 50 ? '#ffc107' :
               strength <= 75 ? '#28a745' : '#20c997'
    };
}

// Form validation function
function validateRegistrationForm(username, email, password) {
    const errors = {};
    
    // Username validation
    if (!username.trim()) {
        errors.username = 'Username is required';
    } else if (username.length < 3 || username.length > 20) {
        errors.username = 'Username must be between 3 and 20 characters';
    }

    // Email validation
    if (!email.trim()) {
        errors.email = 'Email is required';
    } else if (!isValidEmail(email.trim())) {
        errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password.trim()) {
        errors.password = 'Password is required';
    } else if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
    }

    return errors;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default router;

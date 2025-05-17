import express from 'express';
const router = express.Router();

// Get user preferences middleware
const getUserPreferences = (req, res, next) => {
    // Default preferences if user is not logged in
    res.locals.theme = req.session.theme || 'light';
    res.locals.fontPref = req.session.fontPref || 'default';
    next();
};

// Privacy Policy page route
router.get('/', getUserPreferences, (req, res) => {
    res.render('privacy', {
        user: req.session.user || null,
        theme: res.locals.theme,
        fontPref: res.locals.fontPref
    });
});

export default router; 
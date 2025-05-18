import express from 'express';
const router = express.Router();
import db from '../config/db.js';

// Middleware to ensure the user is authenticated
router.use((req, res, next) => {
    if (!req.session.user || !req.session.user.id) {
        return res.redirect('/users/login');
    }
    req.user = req.session.user;
    next();
});

router.get('/', async (req, res) => {
    const userId = req.user.id;

    const getLastSleep = () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT sleep_duration_minutes, sleep_quality, date 
                FROM sleep_logs 
                WHERE user_id = ? 
                ORDER BY date DESC 
                LIMIT 1
            `;
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    };

    const getTodayWater = () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT SUM(amount_ml) AS total_ml 
                FROM water_logs 
                WHERE user_id = ? AND date = CURDATE()
            `;
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]?.total_ml || 0);
            });
        });
    };

    const getRecentWorkouts = () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM workout_logs 
                WHERE user_id = ? 
                ORDER BY date DESC 
                LIMIT 5
            `;
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results || []);
            });
        });
    };

    try {
        const [lastSleep, todayWater, recentWorkouts] = await Promise.all([
            getLastSleep(),
            getTodayWater(),
            getRecentWorkouts()
        ]);

        const waterGoal = 2000; // Daily water goal in ml
        const waterPercentage = Math.min(100, Math.round((todayWater / waterGoal) * 100)) || 0;

        res.render('dashboard', {
            user: req.user,
            lastSleep,
            todayWater,
            waterGoal,
            waterPercentage,
            recentWorkouts
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send('Error loading dashboard data');
    }
});

export default router;

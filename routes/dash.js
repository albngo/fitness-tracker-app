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

    try {
        const [sleepLog, waterTotal] = await Promise.all([getLastSleep(), getTodayWater()]);

        const waterGoal = 2000; // Example: Set water goal to 2000 ml
        const percentage = Math.min(100, Math.round((waterTotal / waterGoal) * 100));

        // Colour transition: red to green
        const hue = Math.round((percentage / 100) * 120); // Smooth transition from red to green
        const progressColor = `hsl(${hue}, 80%, 50%)`;

        res.render('dashboard', {
            user: req.user,
            sleepLength: sleepLog ? (sleepLog.sleep_duration_minutes / 60).toFixed(1) : 0, // Convert minutes to hours
            sleepQuality: sleepLog ? sleepLog.sleep_quality : 'No data',
            waterGoal,
            waterTotal,
            percentage,
            progressColor
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send('Error loading dashboard');
    }
});

export default router;

import express from 'express';
const router = express.Router();
import db from '../config/db.js';

// Middleware to ensure the user is authenticated
router.use((req, res, next) => {
    if (!req.session.user || !req.session.user.id) {
        console.error('No user ID found in session. Redirecting to login.');
        return res.redirect('/users/login');
    }
    req.user = req.session.user;
    next();
});

// Route to display water tracker page with logs and progress bar
router.get('/', (req, res) => {
    const userId = req.session.user.id;

    const getUserData = () => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT water_goal_ml FROM users WHERE id = ?';
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]?.water_goal_ml || 2000);
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

    const getWaterLogs = () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM water_logs 
                WHERE user_id = ? 
                ORDER BY date DESC
            `;
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    Promise.all([getTodayWater(), getWaterLogs(), getUserData()])
        .then(([waterTotal, waterLogs, waterGoal]) => {
            const percentage = Math.min(100, Math.round((waterTotal / waterGoal) * 100)) || 0;

            const hue = Math.round((percentage / 100) * 120); // 0 = red, 120 = green
            const progressColor = `hsl(${hue}, 80%, 50%)`;

            res.render('water', {
                user: req.user,
                waterLogs,
                waterTotal,
                waterGoal,
                percentage,
                progressColor
            });
        })
        .catch(err => {
            console.error('Error fetching water tracker data:', err);
            res.status(500).send('Error loading water tracker');
        });
});

// Route to update water goal
router.post('/update-goal', (req, res) => {
    const { water_goal_ml } = req.body;
    const userId = req.session.user.id;

    if (!water_goal_ml || isNaN(water_goal_ml) || Number(water_goal_ml) < 500 || Number(water_goal_ml) > 10000) {
        req.flash('error', 'Please enter a valid water goal between 500ml and 10000ml.');
        return res.redirect('/water');
    }

    const sql = 'UPDATE users SET water_goal_ml = ? WHERE id = ?';
    db.query(sql, [water_goal_ml, userId], (err) => {
        if (err) {
            console.error('Error updating water goal:', err);
            req.flash('error', 'Failed to update water goal.');
            return res.redirect('/water');
        }

        req.flash('success', 'Water goal updated successfully!');
        res.redirect('/water');
    });
});

// Route to log water intake
router.post('/log', (req, res) => {
    const { amount_ml } = req.body;
    const userId = req.session.user.id;

    if (!amount_ml || isNaN(amount_ml) || Number(amount_ml) <= 0 || Number(amount_ml) > 10000) {
        req.flash('error', 'Please enter a valid amount of water in millilitres.');
        return res.redirect('/water');
    }

    const sql = 'INSERT INTO water_logs (user_id, date, amount_ml) VALUES (?, CURDATE(), ?)';
    db.query(sql, [userId, amount_ml], (err) => {
        if (err) {
            console.error('Error logging water intake:', err);
            return res.status(500).send('Something went wrong with logging the water intake!');
        }

        req.flash('success', 'Water intake logged successfully');
        res.redirect('/water');
    });
});

export default router;

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
                LIMIT 2
            `;
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results || []);
            });
        });
    };

    const getUserWaterGoal = () => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT water_goal_ml FROM users WHERE id = ?';
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]?.water_goal_ml || 2000);
            });
        });
    };

    const generateSleepRecommendation = (sleepData) => {
        if (!sleepData) return "Start tracking your sleep to get personalized recommendations!";
        
        const sleepHours = sleepData.sleep_duration_minutes / 60;
        const quality = sleepData.sleep_quality.toLowerCase();
        
        if (sleepHours < 6) {
            return "You're getting less than 6 hours of sleep. Try to get at least 7-9 hours for optimal health.";
        } else if (sleepHours < 7) {
            return "You're close! Aim for 7-9 hours of sleep for better health and productivity.";
        } else if (sleepHours > 9) {
            return "You're getting more than 9 hours of sleep. While rest is good, too much sleep might affect your daily rhythm.";
        } else if (quality === 'poor' || quality === 'fair') {
            return "Your sleep quality could be better. Try maintaining a consistent sleep schedule and avoiding screens before bed.";
        } else {
            return "Great job! You're getting the recommended amount of sleep. Keep it up! 👍";
        }
    };

    const generateWaterRecommendation = (todayWater, waterGoal) => {
        const percentage = (todayWater / waterGoal) * 100;
        
        if (percentage === 0) {
            return "Start tracking your water intake to stay hydrated throughout the day!";
        } else if (percentage < 25) {
            return "You're way behind on your water intake. Try to drink water regularly throughout the day.";
        } else if (percentage < 50) {
            return "You're less than halfway to your goal. Remember to keep a water bottle handy!";
        } else if (percentage < 75) {
            return "You're doing well, but try to drink more water to reach your daily goal.";
        } else if (percentage < 100) {
            return "Almost there! Just a bit more water to reach your daily goal.";
        } else {
            return "Excellent! You've met your water intake goal for today. Keep staying hydrated! 💧";
        }
    };

    try {
        const [lastSleep, todayWater, recentWorkouts, waterGoal] = await Promise.all([
            getLastSleep(),
            getTodayWater(),
            getRecentWorkouts(),
            getUserWaterGoal()
        ]);

        const waterPercentage = Math.min(100, Math.round((todayWater / waterGoal) * 100)) || 0;
        
        // Generate recommendations
        const sleepRecommendation = generateSleepRecommendation(lastSleep);
        const waterRecommendation = generateWaterRecommendation(todayWater, waterGoal);

        res.render('dashboard', {
            user: req.user,
            lastSleep,
            todayWater,
            waterGoal,
            waterPercentage,
            recentWorkouts,
            sleepRecommendation,
            waterRecommendation
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send('Error loading dashboard data');
    }
});

export default router;

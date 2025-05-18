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

// Sleep data processing functions
function calculateSleepStats(sleepLogs) {
    if (!sleepLogs || sleepLogs.length === 0) {
        return {
            avgDuration: 0,
            avgQuality: 'No Data'
        };
    }

    const avgDuration = sleepLogs.reduce((sum, log) => sum + log.sleep_duration_minutes, 0) / sleepLogs.length;
    const hours = Math.floor(avgDuration / 60);
    const minutes = Math.round(avgDuration % 60);

    const qualityMap = { poor: 1, fair: 2, good: 3, excellent: 4 };
    const avgQualityScore = sleepLogs.reduce((sum, log) => sum + qualityMap[log.sleep_quality], 0) / sleepLogs.length;
    
    let qualityText = 'Poor';
    if (avgQualityScore >= 3.5) qualityText = 'Excellent';
    else if (avgQualityScore >= 2.5) qualityText = 'Good';
    else if (avgQualityScore >= 1.5) qualityText = 'Fair';

    return {
        avgDuration: `${hours}h ${minutes}m`,
        avgQuality: qualityText
    };
}

function getLast7DaysData(sleepLogs) {
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    return {
        labels: last7Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        }),
        data: last7Days.map(date => {
            const dayLogs = sleepLogs.filter(log => 
                new Date(log.date).toISOString().split('T')[0] === date
            );
            return dayLogs.reduce((sum, log) => sum + log.sleep_duration_minutes, 0) / 60;
        })
    };
}

// Route to render the sleep tracking page
router.get('/', (req, res) => {
    const userId = req.user.id;

    // Fetch sleep logs for the user from the database
    db.query('SELECT * FROM sleep_logs WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error fetching sleep logs:', err);
            return res.status(500).send('Error fetching sleep logs');
        }

        const stats = calculateSleepStats(results);
        const chartData = getLast7DaysData(results);

        console.log('Fetched sleep logs:', results);

        // Pass the sleep logs to the template
        res.render('sleep', { 
            sleepLogs: results,
            stats,
            chartData
        });
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

import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import path from 'path';
import workoutRoutes from './routes/workout.js';
import userRoutes from './routes/users.js';
import waterRoutes from './routes/water.js';
import sleepRoutes from './routes/sleep.js';
import profileRouter from './routes/profile.js';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware to handle sessions
app.use(session({
    secret: 'your_secret_key', // Change this to a secure secret
    resave: false,
    saveUninitialized: false, // Only save session when user logs in
    cookie: { secure: false } // Set to true for HTTPS in production
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Specify the 'views' folder for templates

// Middleware setup for parsing form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware to add req.user
app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // Make user globally available in templates
    next();
});


// Set up routes
app.use('/workout', workoutRoutes);
app.use('/users', userRoutes);
app.use('/water', waterRoutes);
app.use('/sleep', sleepRoutes);
app.use('/profile', profileRouter);

// FAQ route
app.get('/faq', (req, res) => {
    res.render('faq', { success: req.query.success || false });
});

// Handle feedback form submission
app.post('/submit-feedback', (req, res) => {
    const { name, email, message } = req.body;

    // Log the feedback to the console for now
    console.log(`Feedback received from ${name} (${email}):`);
    console.log(message);

    // Redirect back to the FAQ page with a success message
    res.redirect('/faq?success=true');
});

// Index route (Home page)
app.get('/', (req, res) => {
    res.render('index', { workout: null, error: null });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

//Profile route
app.get('/profile', (req, res) => {
    res.render('profile', { user: req.session.user });
});

// Assuming user is authenticated and available as req.user
app.post('/users/profile/update', async (req, res) => {
const { username, email, selected_icon } = req.body;
const profileIcon = selected_icon;

    try {
        const user = await User.findById(req.user.id);
        user.username = username;
        user.email = email;

        if (profileIcon) {
            user.profileIcon = profileIcon;
        }

        await user.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

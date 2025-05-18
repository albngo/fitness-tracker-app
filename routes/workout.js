import express from 'express';
import axios from 'axios';
import db from '../config/db.js';

const router = express.Router();

// Hardcoded API key (replace with your actual API key)
const API_KEY = 'pdA86Ga5zszveNHoxm8MmQ==vR9cs6KhPfs9CalH';

// List of valid muscle groups to check against
const validMuscles = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 
  'forearms', 'glutes', 'hamstrings', 'lats', 'lower_back', 'middle_back', 
  'neck', 'quadriceps', 'traps', 'triceps'
];

// Middleware to ensure the user is authenticated
router.use((req, res, next) => {
  console.log('Session user:', req.session.user); // Debug session user
  if (!req.session.user || !req.session.user.id) {
      console.error('No user ID found in session. Redirecting to login.');
      return res.redirect('/users/login');
  }
  req.user = req.session.user; // Attach session user to req.user
  next();
});

// Get workout history for the user
const getWorkoutHistory = (userId, limit = 5) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM workout_logs 
      WHERE user_id = ? 
      ORDER BY date DESC 
      ${limit ? 'LIMIT ?' : ''}
    `;
    db.query(query, limit ? [userId, limit] : [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Render the workout form
router.get('/', async (req, res) => {
  try {
    const workoutHistory = await getWorkoutHistory(req.user.id);
    res.render('workout', { 
      workout: null, 
      error: null,
      workoutHistory,
      user: req.user,
      showingAllHistory: false
    });
  } catch (err) {
    console.error('Error fetching workout history:', err);
    res.render('workout', { 
      workout: null, 
      error: 'Error fetching workout history',
      workoutHistory: [],
      user: req.user,
      showingAllHistory: false
    });
  }
});

// Route to view all workouts
router.get('/history', async (req, res) => {
  try {
    const workoutHistory = await getWorkoutHistory(req.user.id, null);
    res.render('workout', { 
      workout: null, 
      error: null,
      workoutHistory,
      user: req.user,
      showingAllHistory: true
    });
  } catch (err) {
    console.error('Error fetching workout history:', err);
    res.render('workout', { 
      workout: null, 
      error: 'Error fetching workout history',
      workoutHistory: [],
      user: req.user,
      showingAllHistory: true
    });
  }
});

// Route to get all workouts as JSON
router.get('/history/data', async (req, res) => {
  try {
    const workoutHistory = await getWorkoutHistory(req.user.id, null);
    res.json(workoutHistory);
  } catch (err) {
    console.error('Error fetching workout history:', err);
    res.status(500).json({ error: 'Error fetching workout history' });
  }
});

// Fetch workouts based on selected muscle groups
router.post('/generate', async (req, res) => {
  const muscles = Array.isArray(req.body.type) ? req.body.type : [req.body.type];
  const difficulty = req.body.difficulty || 'beginner';
  const exerciseType = req.body.exerciseType || 'strength';
  const showInstructions = req.body.showInstructions === 'true' || req.body.showInstructions === 'on';
  const userId = req.user.id;

  console.log("Selected muscles:", muscles);

  // Validate that all selected muscles are valid
  const invalidMuscles = muscles.filter(muscle => !validMuscles.includes(muscle));
  if (invalidMuscles.length > 0) {
    const workoutHistory = await getWorkoutHistory(userId);
    return res.render('workout', { 
      workout: null, 
      error: `Invalid muscle groups selected: ${invalidMuscles.join(', ')}`,
      workoutHistory,
      user: req.user
    });
  }

  try {
    // Fetch exercises for all selected muscle groups
    const fetchExercises = muscles.map(async (muscle) => {
      console.log(`Fetching exercises for muscle: ${muscle}`);

      const response = await axios.get(
        `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}&difficulty=${difficulty}&type=${exerciseType}`,
        {
          headers: { 'X-Api-Key': API_KEY },
        }
      );

      if (response.data && response.data.length > 0) {
        console.log(`Exercises for ${muscle}:`, response.data);

        const shuffledExercises = response.data.sort(() => 0.5 - Math.random());
        const selectedExercises = shuffledExercises.slice(0, 3);

        return {
          muscle,
          exercises: selectedExercises.map((exercise) => ({
            name: exercise.name,
            type: exercise.type,
            difficulty: exercise.difficulty,
            muscle: exercise.muscle,
            instructions: showInstructions && exercise.instructions ? exercise.instructions : null,
            sets: '3',
            reps: '10',
            rest: '90 seconds',
          })),
        };
      } else {
        return { muscle, exercises: [] };
      }
    });

    const workouts = await Promise.all(fetchExercises);
    console.log("All workouts fetched:", workouts);

    // Save the workout to the database
    const workoutName = `${exerciseType} workout - ${muscles.join(', ')}`;
    const saveWorkout = {
      user_id: userId,
      workout_name: workoutName,
      muscle_groups: muscles.join(','),
      difficulty: difficulty,
      exercise_type: exerciseType,
      exercises: JSON.stringify(workouts)
    };

    db.query('INSERT INTO workout_logs SET ?', saveWorkout, async (err) => {
      if (err) {
        console.error('Error saving workout:', err);
        req.flash('error', 'Error saving workout');
      } else {
        req.flash('success', 'Workout generated and saved successfully!');
      }

      const workoutHistory = await getWorkoutHistory(userId);
      res.render('workout', { 
        workout: workouts, 
        error: null,
        workoutHistory,
        user: req.user,
        showingAllHistory: false
      });
    });

  } catch (error) {
    console.error('Error fetching workout:', error);
    const workoutHistory = await getWorkoutHistory(userId);
    res.render('workout', { 
      workout: null, 
      error: 'Failed to fetch workouts. Please try again later.',
      workoutHistory,
      user: req.user,
      showingAllHistory: false
    });
  }
});

export default router;

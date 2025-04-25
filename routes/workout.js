import express from 'express';
import axios from 'axios';

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

// Render the workout form
router.get('/', (req, res) => {
  res.render('workout', { workout: null, error: null });
});

// Fetch workouts based on selected muscle groups
router.post('/generate', async (req, res) => {
  const muscles = Array.isArray(req.body.type) ? req.body.type : [req.body.type]; // Ensure it's always an array
  const difficulty = req.body.difficulty || 'beginner'; // Default to 'beginner' if no input is provided
  const exerciseType = req.body.exerciseType || 'strength'; // Default to 'strength' if no input is provided
  const showInstructions = req.body.showInstructions === 'true' || req.body.showInstructions === 'on'; // Check if instructions should be shown

  console.log("Selected muscles:", muscles);  // Debug log: Check the selected muscles

  // Validate that all selected muscles are valid
  const invalidMuscles = muscles.filter(muscle => !validMuscles.includes(muscle));
  if (invalidMuscles.length > 0) {
    return res.render('workout', { workout: null, error: `Invalid muscle groups selected: ${invalidMuscles.join(', ')}` });
  }

  try {
    // Fetch exercises for all selected muscle groups
    const fetchExercises = muscles.map(async (muscle) => {
      console.log(`Fetching exercises for muscle: ${muscle}`);  // Debug log: Check the muscle being processed

      const response = await axios.get(
        `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}&difficulty=${difficulty}&type=${exerciseType}`,
        {
          headers: { 'X-Api-Key': API_KEY },  // Use hardcoded API key
        }
      );

      // If the response has exercises
      if (response.data && response.data.length > 0) {
        console.log(`Exercises for ${muscle}:`, response.data);  // Debug log: Check the fetched exercises

        // Shuffle and select 2-3 exercises per muscle group
        const shuffledExercises = response.data.sort(() => 0.5 - Math.random());
        const selectedExercises = shuffledExercises.slice(0, 3); // Select first 3 exercises

        return {
          muscle,
          exercises: selectedExercises.map((exercise) => ({
            name: exercise.name,
            type: exercise.type,
            difficulty: exercise.difficulty,
            muscle: exercise.muscle,
            instructions: showInstructions && exercise.instructions ? exercise.instructions : null,
            sets: '3', // Default sets
            reps: '10', // Default reps
            rest: '90 seconds', // Default rest time
          })),
        };
      } else {
        return { muscle, exercises: [] }; // Return empty exercises if none are found
      }
    });

    // Wait for all API requests to resolve
    const workouts = await Promise.all(fetchExercises);
    console.log("All workouts fetched:", workouts);  // Debug log: Check all fetched workouts

    // Render the data
    res.render('workout', { workout: workouts, error: null });
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.render('workout', { workout: null, error: 'Failed to fetch workouts. Please try again later.' });
  }
});

export default router;

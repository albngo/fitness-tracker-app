# Create the database
CREATE DATABASE IF NOT EXISTS fitness_tracker;

# Use the database
USE fitness_tracker;

# Create the app user
CREATE USER IF NOT EXISTS 'fitness_tracker_user'@'localhost' IDENTIFIED BY 'fitness'; 
GRANT ALL PRIVILEGES ON fitness_tracker.* TO ' fitness_tracker_user'@'localhost';

# Create tables
# Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profileIcon VARCHAR(255),
    theme ENUM('light', 'dark') DEFAULT 'light',
    font_pref ENUM('default', 'dyslexic') DEFAULT 'default',
    water_goal_ml INT DEFAULT 2000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

# Water logs table
CREATE TABLE water_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    amount_ml INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

# Sleep logs table
CREATE TABLE sleep_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    sleep_duration_minutes INT NOT NULL,
    sleep_quality ENUM('poor', 'fair', 'good', 'excellent') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

# Workout logs table
CREATE TABLE workout_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    muscle_group VARCHAR(50),
    exercise_name VARCHAR(100),
    sets INT,
    reps INT,
    workout_name VARCHAR(255),
    muscle_groups TEXT,
    difficulty VARCHAR(50),
    exercise_type VARCHAR(50),
    exercises JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

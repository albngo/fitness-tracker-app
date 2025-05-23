# 🏋️‍♂️ Fitness Tracker Web App

An all-in-one fitness tracking platform that allows users of all ages and fitness levels to monitor their health easily and intuitively. This web app unifies features from multiple health apps into one streamlined experience — built as part of my final year Computer Science project.

## 🎯 Project Goal

To create an accessible and user-friendly fitness tracker web application that brings together key health features into a single platform:
- No more switching between separate water, sleep, and workout apps.
- Simple, modern design with accessibility options for all users.
- Personalised features powered by user input and smart logic.

---

## 🚀 Features

### 🧠 Personalised Workout Generator
- Custom workouts based on **fitness goal**, **level**, and **targeted muscle groups**
- Options to include exercise instructions
- Saves generated workouts for tracking

### 🌙 Sleep Tracker
- Users manually log sleep length and quality
- Dashboard view provides feedback on last night’s sleep

### 💧 Water Tracker
- Daily manual water intake logging
- Dashboard displays current progress with helpful messages

### 📊 Dashboard
- Personalised greeting with user's name
- View today’s water progress, last night’s sleep, and recent workouts at a glance
- Quick access to tracking pages

### ⚙️ Settings
- Toggle **dark mode/light mode**
- Enable **dyslexia-friendly font**
- Secure account deletion

### 🔐 Authentication
- Secure login system with hashed passwords using **bcrypt**
- Session management using **express-session**
- Input validation and sanitisation with **express-validator**

---

## 🛠️ Tech Stack

| Layer        | Tools/Technologies                     |
|--------------|----------------------------------------|
| Frontend     | HTML, CSS, JavaScript, EJS Templates   |
| Backend      | Node.js, Express.js                    |
| Database     | MySQL, `mysql2` for DB connection      |
| Auth & Security | bcrypt, express-session, express-validator |
| Hosting      | Local server environment (for now)     |

---

## 🧪 Testing

- Manual testing across each feature (forms, dashboard updates)
- User testing and surveys to inform improvements
- Mobile responsive layout tested on various screen sizes

---

## 📁 Project Structure

```bash
Fitness-Tracker-App/
├── config/           # Database config
├── public/           # CSS and other public files
├── routes/           # Route files (e.g. water.js, sleep.js)
├── views/            # EJS templates (dashboard.ejs, login.ejs, etc.)
├── app.js            # Main application file
└── README.md

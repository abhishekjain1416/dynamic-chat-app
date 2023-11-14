# Dynamic Chat Application

Welcome to the Chat Application repository! This application allows users to register, log in, and chat with other users in real-time using Socket.IO. The application is built with Node.js for the backend and MongoDB for data storage.

## Features

1. **User Registration:** Users can register on the app by providing necessary information.

2. **User Login:** Registered users can log in to access the application's features.

3. **User Dashboard:** Upon login, users are directed to their dashboard, where they can manage their profile and access various functionalities.

4. **Show All Users on Dashboard:** Users can see a list of all registered users on their dashboard.

5. **Online/Offline Status:** Users can see the online or offline status of other users.

6. **Real-time Chat:** Users can engage in real-time chat with all other registered users.

7. **Chat Updates:** Users can update their chats, ensuring a dynamic and interactive conversation experience.

## Technologies Used

- Node.js
- Socket.IO
- MongoDB
- Mongoose
- Multer
- Express
- Express Session
- Body-parser
- Bcrypt
- Dotenv
- EJS (Embedded JavaScript)

## Getting Started

1. Install dependencies:
~~~
npm init -y
npm install express mongodb mongoose multer express-session body-parser bcrypt dotenv ejs socket.io
~~~
2. Set up MongoDB. Create a MongoDB database.
3. Create a .env file and configure environment variables (e.g., SESSION_SECRET, MONGODB_URI).
4. Create a new folder to store users' profile pics at the path public/images.
5. Start the application:
~~~
npm start
~~~
The application will be accessible at http://localhost:3000.

## Contributing
Feel free to contribute to the project by opening issues or submitting pull requests.

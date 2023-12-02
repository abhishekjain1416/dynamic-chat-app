const express = require('express');
const user_route = express();

const bodyParser = require('body-parser');

/**
 * A middleware for managing user sessions in Express applications.
 * Helps in storing user personal information across the requests.
 */
const session = require('express-session');
const { SESSION_SECRET } = process.env;

user_route.use(session({ secret:SESSION_SECRET }));

const cookieParser = require('cookie-parser');
user_route.use(cookieParser());

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded( {extended:true} ));

user_route.set('view engine','ejs');
user_route.set('views','./views');

user_route.use(express.static('public'));

const path = require('path');

// Require the 'multer' library, which is a middleware for handling 'multipart/form-data' (file uploads).
const multer = require('multer');

// Configure multer to define how uploaded files should be stored.
const storage = multer.diskStorage({

    // Set the destination folder for storing uploaded files.
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/images'));
    },

    // Set the filename for the uploaded file.
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});

const upload = multer({ storage:storage });

// API routes
const userController = require('../controllers/userController');

const auth  = require('../middlewares/auth');

// Registration of a new user
user_route.get('/register', auth.isLogout, userController.registerLoad);
user_route.post('/register',upload.single('image'),userController.register);

// Login and logout by user
user_route.get('/', auth.isLogout, userController.loadLogin);
user_route.post('/',userController.login);
user_route.get('/logout', auth.isLogin, userController.logout);

// One-to-one chats
user_route.get('/dashboard', auth.isLogin, userController.loadDashboard);
user_route.post('/save-chat', userController.saveChat);
user_route.post('/delete-chat', userController.deleteChat);
user_route.post('/update-chat', userController.updateChat);

// Group chats
user_route.get('/groups', auth.isLogin, userController.loadGroups);
user_route.post('/groups', upload.single('image'), userController.createGroup);

// Group members
user_route.post('/get-members',auth.isLogin, userController.getMembers);
user_route.post('/add-members',auth.isLogin, userController.addMembers);

user_route.get('*', function(req,res){
    res.redirect('/');
})

module.exports = user_route;
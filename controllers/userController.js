const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Group = require('../models/groupModel');
const Member = require('../models/memberModel');
const bcrypt = require('bcrypt');

/**
 * Registration of a new user
 */

const registerLoad = async(req,res)=>{

    try {
        
        res.render('register');

    } catch (error) {
        console.log(error.message);
    }
}

const register = async(req,res)=>{

    try {
        /**
         * One-way hash function to encrypt passwords.
         * Difficult for attackers to reverse engineer the original password from the stored hash.
         */
        const passwordHash = await bcrypt.hash(req.body.password,10);

        const user = new User({
            name:req.body.name,
            email:req.body.email,
            image:'images/'+req.file.filename,
            password:passwordHash
        });

        await user.save();

        res.render('register',{message: 'Your Registration has been Successful.'});

    } catch (error) {
        console.log(error.message);
    }
}

/**
 * Login and logout by user
 */

const loadLogin = async(req,res)=>{

    try{

        res.render('login');

    } catch(error) {
        console.log(error.message);
    }
}

const login = async(req,res)=>{

    try{
        // Extract email and password from the request body
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email:email });

        if(userData){
            // Compare the provided password with the hashed password stored in the database
            const passwordMatch = await bcrypt.compare(password, userData.password);

            // If the passwords match, set user data in the session and a cookie, then redirect to the dashboard
            if(passwordMatch == true){
                req.session.user = userData;
                res.cookie('user',JSON.stringify(userData));
                res.redirect('/dashboard');
            }
            else
                res.render('login',{ message:'Email and Password is Incorrect!' });
        }
        else
            res.render('login',{ message:'Email and Password is Incorrect!' });

    } catch(error) {
        console.log(error.message);
    }
}

const logout = async(req,res)=>{

    try{

        req.session.destroy();
        res.clearCookie('user');
        res.redirect('/');

    } catch(error) {
        console.log(error.message);
    }
}

/**
 * One-to-one chats
 */

const loadDashboard = async(req,res)=>{

    try{

        var users = await User.find({ _id: {$nin:[req.session.user._id]} });
        res.render('dashboard',{ user:req.session.user, users:users });

    } catch(error) {
        console.log(error.message);
    }
}

const saveChat = async(req,res)=>{

    try{

        var chat = new Chat({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message: req.body.message
        });

        var newChat = await chat.save();
        res.status(200).send({success: true, msg: 'Chat saved successfully.', data: newChat});

    } catch(error) {
        res.status(400).send({success: false, msg: error.message});
    }
}

const deleteChat = async(req,res)=>{
    try{

        await Chat.deleteOne({ _id: req.body.id});
        res.status(200).send({success: true});

    } catch (errror) {
        res.status(400).send({success: false, msg: error.message});
    }
}

const updateChat = async(req,res)=>{
    try{

        await Chat.findByIdAndUpdate({ _id:req.body.id },{
            $set:{
                message: req.body.message
            }
        });

        res.status(200).send({success: true});

    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
    }
}

/**
 * Group chats
 */

const loadGroups = async(req,res)=>{
    try{

        const groups = await Group.find({ creator_id:req.session.user._id });
        res.render('group',{groups: groups});

    } catch (error) {
        res.render('group', {message: error.message});
    }
}

const createGroup = async(req,res)=>{
    try{

        const group = new Group({
            creator_id: req.session.user._id,
            name: req.body.name,
            image: 'images/'+ req.file.filename,
            limit: req.body.limit
        });

        await group.save();
        const groups = await Group.find({ creator_id:req.session.user._id });

        res.render('group', {message: req.body.name + ' group created successfully.',groups: groups});

    } catch (error) {
        res.render('group', {message: error.message});
    }
}

/**
 * Group members
 */

const getMembers = async(req,res)=>{
    try{

        const users = await User.find({ _id: {$nin:[req.session.user._id]} });

        res.status(200).send({ success:true, data: users });

    } catch(error) {
        res.status(400).send({ success:false, msg:error.message });
    }
}

const addMembers = async(req,res)=>{
    try{

        if(!req.body.members){
            res.status(200).send({ success:false, msg: "Please select any one member!" });
        }
        else if(req.body.members.length > parseInt(req.body.group_limit)){
            res.status(200).send({ success:false, msg: "You cannot select more than "+req.body.group_limit+" members!" });
        }
        else{
            let data = [];
            const members = req.body.members;

            await Member.deleteMany({ group_id: req.body.group_id });

            for(let i=0;i<members.length;i++){
                data.push({
                    group_id: req.body.group_id,
                    user_id: req.body.members[i]
                });
            }

            await Member.insertMany(data);

            res.status(200).send({ success:true, msg: "Members added successfully!" });
        }

    } catch(error) {
        res.status(400).send({ success:false, msg:error.message });
    }
}

module.exports = {
    registerLoad,
    register,
    loadLogin,
    login,
    logout,
    loadDashboard,
    saveChat,
    deleteChat,
    updateChat,
    loadGroups,
    createGroup,
    getMembers,
    addMembers,
}
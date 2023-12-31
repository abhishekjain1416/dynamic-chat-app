const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Group = require('../models/groupModel');
const Member = require('../models/memberModel');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

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

const updateGroup = async(req,res)=>{
    try{

        // If the number of members is greater than the new group limit, inform the user to remove members first.
        if(req.body.limit < req.body.old_limit){
            const membersCount = await Member.countDocuments({ group_id: req.body.id });

            if(membersCount > req.body.limit)
                return res.status(200).send({ success:false, msg:"Please remove members before reducing the limit." });
        }

        // If the number of members is less than the new group limit, proceed.
        let updateObj;

        if(req.file == undefined){
            updateObj = {
                name: req.body.name,
                limit: req.body.limit
            };
        }
        else{
            updateObj = {
                name: req.body.name,
                image: 'images/'+req.file.filename,
                limit: req.body.limit
            };
        }

        await Group.findByIdAndUpdate({ _id: req.body.id },{ $set: updateObj });
        res.status(200).send({ success:true, msg:"Group updated successfully." });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}

/**
 * Group members
 */

const getMembers = async(req,res)=>{
    try{
        // Check if the 'group_id' is missing in the request body.
        if (!req.body.group_id) {
            return res.status(200).send({ success: false, msg: "Missing group_id in the request body." });
        }

        // Check if the user session or user ID is invalid.
        if (!req.session.user || !req.session.user._id) {
            return res.status(200).send({ success: false, msg: "Invalid session user or user ID." });
        }

        // Use the aggregate method to perform a MongoDB aggregation on the User collection.
        const users = await User.aggregate([
            {
                // Perform a lookup to get members associated with the user.
                $lookup: {
                    from: "members",
                    localField: "_id",
                    foreignField: "user_id",
                    pipeline: [
                        {
                            // Match members based on the provided group_id.
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$group_id", new mongoose.Types.ObjectId(req.body.group_id)] }
                                    ]
                                }
                            }
                        }
                    ],
                    // Store the result in the 'member' field.
                    as: "member"
                }
            },
            // Filter out the current user from the result using $nin (not in).
            {
                $match: {
                    "_id": {
                        $nin: [new mongoose.Types.ObjectId(req.session.user._id)]
                    }
                }
            }
        ]);

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

            res.status(200).send({ success:true, msg: "Members updated successfully!" });
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
    updateGroup,
    getMembers,
    addMembers,
}
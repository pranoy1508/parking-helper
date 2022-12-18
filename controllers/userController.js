const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const UserModel = require("../models/user.js");
const passwordGen=require("generate-password");
const _=require("lodash-contrib");

const getAllUserDetails = asyncHandler(async (req, res) => {
    const userDetails = await mongoMiddleware.GetAllUsers();
    return res.json(userDetails);
});


const addUser=asyncHandler(async(req,res)=>{
    const userDetails=req.body;
    if (!_.strContains(userDetails.userName.toUpperCase(), process.env.ALLOWED_EMAIL_DOMAIN))
    {
        return res.json({
            statusCode: 2021,
            message: `User addition not allowed for the given email id`
        });
    }
    const existingUser = await UserModel.findOne({ userName: userDetails.userName });
    if(existingUser)
    {
        return res.json({
            statusCode:2020,
            message: `User for ${userDetails.userName} already exists`
        });
    }
    else 
    {
        let user={};
        user.userName=userDetails.userName;
        user.userRole = userDetails.role;
        user.userPassword = passwordGen.generate({
            length: 10,
            numbers: true,

        });
        const addedUserResult = await UserModel.create(user);
        if (addedUserResult._id) {
            return res.json({
                statusCode: 201,
                message: "User added successfully.",
            });
        }
    }
});

module.exports = { getAllUserDetails, addUser };
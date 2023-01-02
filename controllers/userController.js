const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const UserModel = require("../models/user.js");
const passwordGen = require("generate-password");
const _ = require("lodash-contrib");

const getAllUserDetails = asyncHandler(async (req, res) => {
    const userDetails = await mongoMiddleware.GetAllUsers();
    return res.json(userDetails);
});


const addUser = asyncHandler(async (req, res) => {
    const userDetails = req.body;
    const allowedUserDomain = process.env.ALLOWED_EMAIL_DOMAIN.split(";");
    try {
        if (_.includes(allowedUserDomain, userDetails.userName.split("@")[1].toUpperCase())) {
            const existingUser = await UserModel.findOne({ userName: userDetails.userName });
            if (existingUser) {
                return res.json({
                    statusCode: 2020,
                    message: `User for ${userDetails.userName} already exists`
                });
            }
            else {
                let user = {};
                user.userName = userDetails.userName;
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
        }
        else return res.json({
            statusCode: 2021,
            message: `User addition not allowed for the given email id`
        });
    }
    catch (exception) {
        return res.json({
            statusCode: 2021,
            message: `Please enter valid user name`
        });
    }

});

const addUsersViaExcel = asyncHandler(async (req, res) => {
    const input = req.body;
    let usersList = [];
    for (let k = 0; k < parseInt(input.count); k++) {
        var row = input.data[k];
        let $user = {
            userName: row[0],
            userRole: row[1] ? row[1] : "USER",
            userPassword: passwordGen.generate({
                length: 10,
                numbers: true,

            }),
            location: row[2],
            action: row[3] ? row[3] : "ADD"
        };
        usersList.push($user);
    }
    if (usersList.length > 0) {

    }
});


module.exports = { getAllUserDetails, addUser, addUsersViaExcel };
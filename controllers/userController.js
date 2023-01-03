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
    const allowedUserDomain = process.env.ALLOWED_EMAIL_DOMAIN.split(";");
    for (let k = 0; k < parseInt(input.count); k++) {
        var row = input.data[k];
        try {
            if (_.includes(allowedUserDomain, row[0].split("@")[1].toUpperCase())) {
                const existingUser = await UserModel.findOne({ userName: row[0] });
                const _locationId = row[1] && row[1] == "SUPPORT" ? await getLocationId(row[2]) : null;
                if (!existingUser || (existingUser && row[3] == "REMOVE")) {
                    let $user = {
                        userName: row[0],
                        userRole: row[1] ? row[1] : "USER",
                        userPassword: passwordGen.generate({
                            length: 10,
                            numbers: true,

                        }),
                        locationId: _locationId,
                        action: row[3] ? row[3] : "ADD"
                    };
                    usersList.push($user);
                }
            }
        }
        catch (exception) {
            //do nothing
        }
    }
    if (usersList.length > 0) {
        const addedUserList = _.filter(usersList, (x) => { return x.action == "ADD" });
        const removedUserList = _.filter(usersList, (x) => { return x.action == "REMOVE" });
        if (addedUserList.length > 0) {
            for (const $user of addedUserList) {
                let newUser = {};
                newUser.userName = $user.userName;
                newUser.userRole = $user.userRole;
                newUser.userPassword = $user.userPassword;
                newUser.locationId = $user.locationId;
                await UserModel.create(newUser);
            }
        }

        if (removedUserList.length > 0) {
            for (const $user of removedUserList) {
                await UserModel.deleteOne({ userName: $user.userName });
                await mongoMiddleware.RemoveVehicleDetailsByUserName($user.userName);
            }
        }
        return res.json({
            statusCode: 200,
            message: `Users Updated Properly. Added Users Count : ${addedUserList.length} | Removed Users Count : ${removedUserList.length}`
        });
    }
});

async function getLocationId(locationName) {
    const locationDetails = await mongoMiddleware.GetFullOfficeLocations();
    const contextOffice = _.filter(locationDetails, ($loc) => { return $loc.OfficeLocation == locationName.trim() });
    return (contextOffice.length > 0 ? _.first(contextOffice).OfficeId : null);
}


module.exports = { getAllUserDetails, addUser, addUsersViaExcel };
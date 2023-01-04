const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const UserModel = require("../models/user.js");
const passwordGen = require("generate-password");
const _ = require("lodash-contrib");
const emailMiddleware = require("../middleware/emailMiddleware");
const ImportHistory = require('../models/importHistory');
const excelJs = require("exceljs");

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
                user.createdDate = new Date();
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
                const _locationId = row[2] && row[2].toUpperCase() == "SUPPORT" ? await getLocationId(row[3]) : null;
                if (!existingUser || (existingUser && row[4].toUpperCase() == "REMOVE")) {
                    let $user = {
                        userName: row[0],
                        userRole: row[2] ? row[2].toUpperCase() : "USER",
                        userPassword: (existingUser) ? existingUser.userPassword : passwordGen.generate({
                            length: 10,
                            numbers: true,

                        }),
                        locationId: _locationId,
                        action: row[4] ? row[4].toUpperCase() : "ADD"
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
                newUser.createdDate = new Date();
                await UserModel.create(newUser);
                const emailBody = await getEmailBodyForUserAddition(await emailMiddleware.GetEmailBodyTemplate("userAddition"), newUser);
                emailMiddleware.TriggerEmail(newUser.userName, `Welcome to ParkWhiz`, emailBody);
            }
        }
        if (removedUserList.length > 0) {
            for (const $user of removedUserList) {
                await UserModel.deleteOne({ userName: $user.userName });
                await mongoMiddleware.RemoveVehicleDetailsByUserName($user.userName);
            }
        }
        const history = new ImportHistory(req.session.users_id.userName, parseInt(input.count), addedUserList, removedUserList);
        await mongoMiddleware.CreateImportHistory(history);
        return res.json({
            statusCode: 200,
            message: `Users Updated Properly. Added Users Count : ${addedUserList.length} | Removed Users Count : ${removedUserList.length}`
        });
    }
});

const getUserDetailsByUserName = asyncHandler(async (req, res) => {
    const userDetails = await UserModel.findOne({ userName: req.query.user });
    if (!userDetails) {
        return res.json(`<p><h5 style="font-weight:bold;color:red">No user found for ${req.query.user}</h5></p>`);
    }
    let result = {};
    result.userDetails = [userDetails];
    res.render("pages/admin/partials/_userViewPartial", {
        items: result,
        groupName: "admin",
        layout: false
    });
});

const exportImportHistory = asyncHandler(async (req, res) => {
    const historyId = req.query.id;
    let importHistory = await mongoMiddleware.GetImportHistoryById(historyId);
    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("ImportHistory");

    worksheet.columns = [
        { header: "UserName", key: "userName", width: 20 },
        { header: "Password", key: "userPassword", width: 20 },
        { header: "Role", key: "userRole", width: 20 },
        { header: "Action", key: "action", width: 20 },
    ];
    const historyCollection = await getExcelHistoryData(importHistory);
    worksheet.addRows(historyCollection);
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + `Import_${historyId}.xlsx`
    );
    return workbook.xlsx.write(res).then(function () {
        res.status(200).end();
    });
});

const searchViewHistory=asyncHandler(async(req,res)=>{
    const historyId = req.query.id;
    let importHistoryRes = await mongoMiddleware.GetImportHistoryById(historyId);
    if (!importHistoryRes) {
        return res.json(`<p><h5 style="font-weight:bold;color:red">No record found for ${historyId}</h5></p>`);
    }
    let result = {};
    result.importHistory = [importHistoryRes];
    res.render("pages/admin/partials/_importHistoryPartial", {
        items: result,
        groupName: "admin",
        layout: false
    });
});

async function getLocationId(locationName) {
    const locationDetails = await mongoMiddleware.GetFullOfficeLocations();
    const contextOffice = _.filter(locationDetails, ($loc) => { return $loc.OfficeLocation == locationName.trim() });
    return (contextOffice.length > 0 ? _.first(contextOffice).OfficeId : null);
}

async function getEmailBodyForUserAddition(template, newUser) {
    return template.replace("$user", newUser.userName).replace("$pwd", newUser.userPassword).replace("$userName", newUser.userName);
}

async function getExcelHistoryData(importHistory) {
    let excelData = [];
    importHistory.addedUsers.forEach(p => {
        excelData.push(p);
    });
    importHistory.removedUsers.forEach(p => {
        excelData.push(p);
    });
    return excelData;
}


module.exports = { getAllUserDetails, addUser, addUsersViaExcel, getUserDetailsByUserName, exportImportHistory, searchViewHistory };
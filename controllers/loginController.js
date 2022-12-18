const asyncHandler = require("express-async-handler");
const UserModel = require("../models/user.js")

exports.index = asyncHandler(async (req, res) => {
    const stored_session = req.session;
    const users_id = stored_session.users_id;
    if (users_id) {
        res.redirect("/masteritem");
    } else {
        return res.render("pages/index", {
        });
    }
});

exports.login_post = asyncHandler(async (req, res) => {
    const userName = req.body.userName;
    const userPassword = req.body.userPassword;
    const result = await UserModel.findOne({ userName: userName });
    if (result != null) {
        if (result.userName === userName && result.userPassword === userPassword) {
            req.session.users_id = result
            return res.json({
                status: true,
                message: "Login Successful.",
            });
        } else {
            return res.json({
                status: false,
                message: "Invalid login details",
            });
        }
    } else {
        return res.json({
            status: false,
            message: "This email is not Registered",
        });
    }

});

exports.changePassword = asyncHandler(async (req, res) => {
    const { input_old_password, enter_new_password, re_enter_new_password } = req.body;
    const store_user_id = req.session.users_id
    var store_pass_session = store_user_id.userPassword;

    if (store_pass_session == input_old_password && enter_new_password == re_enter_new_password) {
        await UserModel.findOneAndUpdate({ userPassword: input_old_password }, { userPassword: enter_new_password });
        return res.json({
            status: true,
            message: "Password Updated Successful",
        });
    } else {
        return res.json({
            status: false,
            message: "Please Enter New Password Same",
        });
    }
});


exports.logout = asyncHandler(async (req, res) => {
    req.session.destroy(function (err) {
        req.logout;
        res.redirect("/");
    });
});

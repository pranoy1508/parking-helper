const mongoose = require("mongoose");


const UserSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    userPassword: { type: String, required: true },
    userRole: { type: String, required: true },
    locationId: { type: String, required: false },
    createdDate: {
        type: Date,
        default: new Date(),
        required:true
    }
});

const UserModel = mongoose.model("Users", UserSchema, "Users");

module.exports = UserModel;
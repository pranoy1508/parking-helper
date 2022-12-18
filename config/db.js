const mongoose = require("mongoose");

exports.connectDB = async (DATABASE_URL)=>{
    try {
        const dbOption ={
            dbName: process.env.DB_NAME,
         }
         await mongoose.connect(DATABASE_URL , dbOption);
         console.log("server is connected to the dataBase");

    } catch (error) {
        console.log(error);
    }
}

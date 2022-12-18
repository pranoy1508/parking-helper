const mongoose = require("mongoose");


const ParkingLogsSchema = new mongoose.Schema({
    vehicleType: { type: Number, required: true },
    vehicleNumber: { type: String, required: false },
    parkingLocation: { type: String, required: true },
    linkedRfidCard: { type: String, required: false },
    parkingDate: { type: Date, required: true },
    createdBy: { type: String, required: true },
    ownerName: { type: String, required: false },
    ownerId: { type: String, required: true }
});

const ParkingLogs = mongoose.model("ParkingLogs", ParkingLogsSchema, "ParkingLogs");

module.exports = ParkingLogs;
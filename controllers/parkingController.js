const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const ParkingLogs = require("../models/parkingLogs");



const onLoad = asyncHandler(async (req, res) => {
    const officeDetails = await mongoMiddleware.GetAllOfficeLocations();
    officeDetails.unshift("-- Please Select --");
    let loadDetails = {};
    loadDetails.officeDetails = officeDetails;
    res.render("pages/security/index", {
        items: loadDetails,
        groupName: "security"
    });
});

const addParkingLogs = asyncHandler(async (req, res) => {
    const parkingDetails = req.body;
    let parkingLog = {};
    parkingLog.vehicleType = parkingDetails.vehicleType;
    parkingLog.vehicleNumber = parkingDetails.vehicleNumber;
    parkingLog.parkingLocation = parkingDetails.parkingLocation;
    parkingLog.linkedRfidCard = parkingDetails.rfid;
    parkingLog.parkingDate = new Date();
    parkingLog.createdBy = req.session.users_id.userName;
    parkingLog.ownerName = parkingDetails.empName;
    parkingLog.ownerId = parkingDetails.empId;
    const addedLogResult = await ParkingLogs.create(parkingLog);
    if (addedLogResult._id) {
        return res.json({
            statusCode: 200,
            message: "Log added successfully.",
        });
    }

});

module.exports = { onLoad, addParkingLogs };
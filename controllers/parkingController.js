const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const ParkingLogs = require("../models/parkingLogs");



const onLoad = asyncHandler(async (req, res) => {
    let officeDetails = await mongoMiddleware.GetFullOfficeLocations();
    for (let office of officeDetails) {
        if (office.ParkingLocations) {
            for (let parking of office.ParkingLocations) {
                const locationIdDetails = await mongoMiddleware.GetParkingDetails(parking.LocationId);
                parking.TotalTwoWheelerCount = locationIdDetails.NoOfTwoWheelerParking;
                parking.TotalFourWheelerCount = locationIdDetails.NoOfFourWheelerParking;
                parking.AvailableTwoWheelerCount = locationIdDetails.NoOfTwoWheelerParking;
                parking.AvailableFourWheelerCount = locationIdDetails.NoOfFourWheelerParking;
                parking.RequestedTwoWheelerCount = locationIdDetails.NoOfTwoWheelerParking;
                parking.RequestedFourWheelerCount = locationIdDetails.NoOfFourWheelerParking;
            }
        }
    }
    res.render("pages/security/index", {
        items: officeDetails,
        groupName: "security"
    });
});

const addParkingLogs = asyncHandler(async (req, res) => {
    const parkingDetails = req.body;
    let parkingLog = {};
    parkingLog.vehicleType = parseInt(parkingDetails.vehicleType);
    parkingLog.vehicleNumber = parkingDetails.vehicleNumber;
    parkingLog.parkingLocation = parkingDetails.parkingLocation;
    parkingLog.linkedRfidCard = parkingDetails.rfid;
    parkingLog.parkingDate = new Date();
    parkingLog.createdBy = req.session.users_id.userName;
    parkingLog.ownerName = parkingDetails.empName;
    parkingLog.ownerId = parkingDetails.empId;
    if (!parkingLog.vehicleNumber || parkingLog.vehicleNumber == "" || parkingLog.vehicleNumber==" ")
    {
        return res.json({
            statusCode: 4021,
            message: "Vehicle number is mandatory. Please enter the vehicle number and try again",
        });
    }
    if (!parkingLog.parkingLocation || parkingLog.parkingLocation == "" || parkingLog.parkingLocation == " ") {
        return res.json({
            statusCode: 4022,
            message: "Parking Location is mandatory. Please select a parking location and try again",
        });
    }
    const addedLogResult = await ParkingLogs.create(parkingLog);
    if (addedLogResult._id) {
        return res.json({
            statusCode: 200,
            message: "Log added successfully.",
        });
    }

});
module.exports = { onLoad, addParkingLogs };
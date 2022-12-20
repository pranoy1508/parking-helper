const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const ParkingLogs = require("../models/parkingLogs");



const onLoad = asyncHandler(async (req, res) => {
    let officeDetails = await mongoMiddleware.GetFullOfficeLocations();
    const vehicleDetails=await mongoMiddleware.GetAllVehicleInformation();
    const sysDate = new Date().toISOString().split('T')[0];
    const startDate =`${sysDate}T00:00:00`;
    const endDate = `${sysDate}T23:59:59`;
    for (let office of officeDetails) {
        if (office.ParkingLocations) {
            for (let parking of office.ParkingLocations) {
                const twoWheelerCount = await mongoMiddleware.GetVehicleCountByType(0,parking.LocationId,startDate,endDate);
                const fourWheelerCount = await mongoMiddleware.GetVehicleCountByType(1, parking.LocationId, startDate, endDate);
                const locationIdDetails = await mongoMiddleware.GetParkingDetails(parking.LocationId);
                parking.TotalTwoWheelerCount = locationIdDetails.NoOfTwoWheelerParking;
                parking.TotalFourWheelerCount = locationIdDetails.NoOfFourWheelerParking;
                parking.AvailableTwoWheelerCount = locationIdDetails.NoOfTwoWheelerParking - twoWheelerCount;
                parking.AvailableFourWheelerCount = locationIdDetails.NoOfFourWheelerParking - fourWheelerCount;
                parking.RequestedTwoWheelerCount = locationIdDetails.NoOfTwoWheelerParking;
                parking.RequestedFourWheelerCount = locationIdDetails.NoOfFourWheelerParking;
            }
        }
    }
    let responseDetails={};
    responseDetails.officeDetails=officeDetails;
    responseDetails.vehicleDetails = vehicleDetails;
    res.render("pages/security/index", {
        items: responseDetails,
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
    const addedLogResult = await mongoMiddleware.CreateParkingLog(parkingLog);
    if (addedLogResult.insertedCount && addedLogResult.insertedCount==1) {
        return res.json({
            statusCode: 200,
            message: "Log added successfully.",
        });
    }
    else {
        return res.json({
            statusCode: 4023,
            message: "Sorry some error occurred.",
        });
    }

});
module.exports = { onLoad, addParkingLogs };
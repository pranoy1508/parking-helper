const _ = require("lodash");
const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");



const onLoad = asyncHandler(async (req, res) => {
    let officeDetails = await mongoMiddleware.GetFullOfficeLocations();
    officeDetails = _.filter(officeDetails, ($off) => { return $off.OfficeId == req.session.users_id.locationId });
    const vehicleDetails = await mongoMiddleware.GetAllVehicleInformation();
    const reservationResponse = await mongoMiddleware.GetParkingRequestsByUserName(req.session.users_id.userName, 5);
    const sysDate = new Date().toISOString().split('T')[0];
    const startDate = `${sysDate}T00:00:00`;
    const endDate = `${sysDate}T23:59:59`;
    for (let office of officeDetails) {
        if (office.ParkingLocations) {
            for (let parking of office.ParkingLocations) {
                const twoWheelerCount = await mongoMiddleware.GetVehicleCountByType(0, parking.LocationId, startDate, endDate);
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
    };
    for (let res of reservationResponse) {
        const linkedOffice = _.find(officeDetails, (office) => {
            if (office.ParkingLocations) {
                const contextParking = _.find(office.ParkingLocations, ($p) => {
                    if ($p.LocationId == res.locationId) {
                        res.parkingLocation = $p.LocationName;
                        return true;
                    }
                });
                return contextParking;
            }
        });
        res.officeLocation = linkedOffice ? linkedOffice.OfficeLocation : null;
    }
    let responseDetails = {};
    responseDetails.officeDetails = officeDetails;
    responseDetails.vehicleDetails = vehicleDetails;
    responseDetails.reservations = reservationResponse;
    responseDetails.userRole = req.session.users_id.userRole;
    res.render("pages/security/index", {
        items: responseDetails,
        groupName: "security"
    });
});

const addParkingLogs = asyncHandler(async (req, res) => {
    const parkingDetails = req.body;
    const sysDate = new Date().toISOString().split('T')[0];
    const startDate = `${sysDate}T00:00:00`;
    const endDate = `${sysDate}T23:59:59`;
    const locationDetails = await mongoMiddleware.GetParkingDetails(parkingDetails.parkingLocation);
    const bookedCount = await mongoMiddleware.GetVehicleCountByType(parseInt(parkingDetails.vehicleType), parkingDetails.parkingLocation, startDate, endDate);
    const totalCount = parseInt(parkingDetails.vehicleType) == 0 ? locationDetails.NoOfTwoWheelerParking : locationDetails.NoOfFourWheelerParking;
    const availableCount = totalCount - bookedCount;
    if (availableCount > 0) {
        let parkingLog = {};
        parkingLog.vehicleType = parseInt(parkingDetails.vehicleType);
        parkingLog.vehicleNumber = parkingDetails.vehicleNumber;
        parkingLog.parkingLocation = parkingDetails.parkingLocation;
        parkingLog.linkedRfidCard = parkingDetails.rfid;
        parkingLog.parkingDate = new Date();
        parkingLog.createdBy = req.session.users_id.userName;
        parkingLog.ownerName = parkingDetails.empName;
        parkingLog.ownerId = parkingDetails.empId;
        if (!parkingLog.vehicleNumber || parkingLog.vehicleNumber == "" || parkingLog.vehicleNumber == " ") {
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
        if (addedLogResult.insertedCount && addedLogResult.insertedCount == 1) {
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
    }
    else{
        return res.json({
            statusCode: 4044,
            message: `No Available Parking Space available for ${sysDate}`,
        });
    }

});

const getAvailabilityView=asyncHandler(async(req,res)=>{
    let officeDetails = await mongoMiddleware.GetFullOfficeLocations();
    officeDetails = _.filter(officeDetails, ($off) => { return $off.OfficeId == req.session.users_id.locationId });
    const sysDate = new Date().toISOString().split('T')[0];
    const startDate = `${sysDate}T00:00:00`;
    const endDate = `${sysDate}T23:59:59`;
    for (let office of officeDetails) {
        if (office.ParkingLocations) {
            for (let parking of office.ParkingLocations) {
                const twoWheelerCount = await mongoMiddleware.GetVehicleCountByType(0, parking.LocationId, startDate, endDate);
                const fourWheelerCount = await mongoMiddleware.GetVehicleCountByType(1, parking.LocationId, startDate, endDate);
                const locationIdDetails = await mongoMiddleware.GetParkingDetails(parking.LocationId);
                parking.AvailableTwoWheelerCount = locationIdDetails.NoOfTwoWheelerParking - twoWheelerCount;
                parking.AvailableFourWheelerCount = locationIdDetails.NoOfFourWheelerParking - fourWheelerCount;
            }
        }
    };
    let responseDetails = {};
    responseDetails.officeDetails = officeDetails;
    res.render("pages/security/partials/_freeViewPartial", {
        items: responseDetails,
        groupName: "security",
        layout:false
    });
});

module.exports = { onLoad, addParkingLogs, getAvailabilityView };
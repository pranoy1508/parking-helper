const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const VehicleDetails = require("../models/vehicleDetails");

const onLoad = asyncHandler(async (req, res) => {
    let vehicleInfo = await mongoMiddleware.GetVehicleInformationByName(req.session.users_id.userName);
    let officeDetails = await mongoMiddleware.GetFullOfficeLocations();
    const sysDate = new Date().toISOString().split('T')[0];
    const startDate = `${sysDate}T00:00:00`;
    const endDate = `${sysDate}T23:59:59`;
    if (vehicleInfo && vehicleInfo.length == 0) {
        vehicleInfo = [];
        vehicleInfo.push(new VehicleDetails(req.session.users_id.userName));
    }
    for (let office of officeDetails) {
        if (office.ParkingLocations) {
            for (let parking of office.ParkingLocations) {
                const locationIdDetails = await mongoMiddleware.GetParkingDetails(parking.LocationId);
                parking.TotalTwoWheelerCount = locationIdDetails.NoOfTwoWheelerParking;
                parking.TotalFourWheelerCount = locationIdDetails.NoOfFourWheelerParking;
                parking.BookedTwoWheelerCount = await mongoMiddleware.GetVehicleCountByType(0, parking.LocationId, startDate, endDate);;
                parking.BookedFourWheelerCount = await mongoMiddleware.GetVehicleCountByType(1, parking.LocationId, startDate, endDate);;
            }
        }
    }
    let returnResponse = {};
    returnResponse.vehicleInfo = vehicleInfo;
    returnResponse.officeDetails = officeDetails;
    returnResponse.userRole = req.session.users_id.userRole;
    res.render("pages/users/index", {
        items: returnResponse,
        groupName: "users"
    });
});

const checkAvailability = asyncHandler(async (req, res) => {
    const payload = req.body;
    const startDate = `${payload.requestedData}T00:00:00`;
    const endDate = `${payload.requestedData}T23:59:59`;
    let locationDetails = await mongoMiddleware.GetParkingDetails(payload.locationId);
    locationDetails.BookedFourWheelerCount = await mongoMiddleware.GetVehicleCountByType(1, payload.locationId, startDate, endDate);
    locationDetails.BookedTwoWheelerCount = await mongoMiddleware.GetVehicleCountByType(0, payload.locationId, startDate, endDate);
    locationDetails.TotalFourWheelerCount = locationDetails.NoOfFourWheelerParking;
    locationDetails.TotalTwoWheelerCount = locationDetails.NoOfTwoWheelerParking;
    
    res.json(locationDetails);

});
module.exports = { onLoad, checkAvailability };
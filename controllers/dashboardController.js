const _ = require("lodash");
const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const VehicleDetails = require("../models/vehicleDetails");
const emailMiddleware = require("../middleware/emailMiddleware");




const onLoad = asyncHandler(async (req, res) => {
    let returnResponse = {};
    let vehicleInfo = await mongoMiddleware.GetVehicleInformationByName(req.session.users_id.userName);
    let officeDetails = await mongoMiddleware.GetFullOfficeLocations();
    if (vehicleInfo.length == 0) {
        vehicleInfo = [];
        vehicleInfo.push(new VehicleDetails(req.session.users_id.userName, null, 0, null));
        vehicleInfo.push(new VehicleDetails(req.session.users_id.userName, null, 1, null));
        returnResponse.IsTwoWheelerRegistered = false;
        returnResponse.IsFourWheelerRegistered = false;
    }
    else if (vehicleInfo.length == 1) {
        switch (_.first(vehicleInfo).vehicleType) {
            case 0:
                vehicleInfo.push(new VehicleDetails(req.session.users_id.userName, null, 1, null));
                returnResponse.IsTwoWheelerRegistered = true;
                returnResponse.IsFourWheelerRegistered = false;
                break;
            case 1:
                vehicleInfo.unshift(new VehicleDetails(req.session.users_id.userName, null, 0, null));
                returnResponse.IsTwoWheelerRegistered = false;
                returnResponse.IsFourWheelerRegistered = true;
                break;
            default:
                break;
        }
    }
    else if(vehicleInfo.length==2)
    {
        returnResponse.IsTwoWheelerRegistered = vehicleInfo.filter(x => x.vehicleType==0).length>0;
        returnResponse.IsFourWheelerRegistered = vehicleInfo.filter(x => x.vehicleType == 1).length > 0;
    }
    for (let office of officeDetails) {
        if (office.ParkingLocations) {
            for (let parking of office.ParkingLocations) {
                const locationIdDetails = await mongoMiddleware.GetParkingDetails(parking.LocationId);
                parking.TotalTwoWheelerCount = locationIdDetails.NoOfTwoWheelerParking;
                parking.TotalFourWheelerCount = locationIdDetails.NoOfFourWheelerParking;
                parking.BookedTwoWheelerCount = await mongoMiddleware.GetVehicleCountByType(0, parking.LocationId, new Date().setHours(0, 0, 0, 0), new Date().setHours(23, 59, 59, 0));;
                parking.BookedFourWheelerCount = await mongoMiddleware.GetVehicleCountByType(1, parking.LocationId, new Date().setHours(0, 0, 0, 0), new Date().setHours(23, 59, 59, 0));;
            }
        }
    }
    returnResponse.vehicleInfo = vehicleInfo;
    returnResponse.officeDetails = officeDetails;
    returnResponse.userRole = req.session.users_id.userRole;
    returnResponse.userName = req.session.users_id.userName;
    returnResponse.parkingLog = await mongoMiddleware.GetPendingParkingLogByUserName(req.session.users_id.userName, new Date().setHours(0, 0, 0, 0), new Date().setHours(23, 59, 59, 0));
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

const registerVehicle = asyncHandler(async (req, res) => {
    const payload = req.body;
    if (payload.twoWheelerNo) {
        var vehicle = new VehicleDetails(req.session.users_id.userName, payload.userId, 0, payload.twoWheelerNo);
        mongoMiddleware.RegisterVehicle(vehicle);
    }
    if (payload.fourWheelerNo) {
        var vehicle = new VehicleDetails(req.session.users_id.userName, payload.userId, 1, payload.fourWheelerNo);
        mongoMiddleware.RegisterVehicle(vehicle);
    }
    const emailSubject = process.env.VEHICLE_REGISTRATION_SUBJECT.replace('$user', req.session.users_id.userName);
    emailMiddleware.TriggerEmail(req.session.users_id.userName, emailSubject,await emailMiddleware.GetEmailBodyTemplate("vehicleRegistration"));
    return res.json("Successfully registered the vehicle");
});


module.exports = { onLoad, checkAvailability, registerVehicle };
const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const ParkingDetails=require("../models/parkingDetails");

const onLoad = asyncHandler(async (req, res) => {
    const officeDetails = await mongoMiddleware.GetAllOfficeLocations();
    officeDetails.unshift("-- Please Select --");
    res.render("pages/admin/index", {
        locations: officeDetails,
        groupName: "admin"
    });
});


const getParkingLocationsByOffice = asyncHandler(async (req, res) => {
    const { officeLocation } = req.body;
    const response = await mongoMiddleware.GetParkingLocationsByOffice(officeLocation);
    return res.json(response);
});

const getParkingDetails = asyncHandler(async (req, res) => {
    const { locationId } = req.body;
    const response = await mongoMiddleware.GetParkingDetails(locationId);
    return res.json(response);
});

const updateLocationDetails = asyncHandler(async (req, res) => {
    let payload = req.body;
    payload.user = req.session.users_id.userName;
    const response = await mongoMiddleware.GetParkingDetails(payload.locationId);
    if (!response) {
        const parkingDetails = new ParkingDetails(payload);
        await mongoMiddleware.CreateParkingDetails(parkingDetails);
    }
    else if (parseInt(payload.twoWheelerCount) == response.NoOfTwoWheelerParking && parseInt(payload.fourWheelerCount) == response.NoOfFourWheelerParking) {
        return res.json({
            "statusCode": 9999,
            "message": "No changes found to update"
        });
    }
    else {
        await mongoMiddleware.UpdateParkingDetails(payload);
    }
    return res.json({"statusCode":200,"message":"Updated Successfully"});
});



module.exports = { onLoad, getParkingLocationsByOffice, getParkingDetails, updateLocationDetails };
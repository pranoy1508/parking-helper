const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const ParkingDetails=require("../models/parkingDetails");
const _=require("lodash");

const onLoad = asyncHandler(async (req, res) => {
    const officeDetails = await mongoMiddleware.GetAllOfficeLocations();
    const userDetails=await mongoMiddleware.GetAllUsers();
    let workLists=await mongoMiddleware.GetPendingParkingRequests(5);
    officeDetails.unshift("-- Please Select --");
    let loadDetails={};
    loadDetails.officeDetails = officeDetails;
    loadDetails.userDetails = userDetails;
    const fullDetails = await mongoMiddleware.GetFullOfficeLocations();
    for (let res of workLists) {
        const linkedOffice = _.find(fullDetails, (office) => {
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
    loadDetails.workLists = workLists;
    res.render("pages/admin/index", {
        items: loadDetails,
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
            statusCode: 9999,
            message: "No changes found to update"
        });
    }
    else {
        await mongoMiddleware.UpdateParkingDetails(payload);
    }
    return res.json({statusCode:200,message:"Updated Successfully"});
});

module.exports = { onLoad, getParkingLocationsByOffice, getParkingDetails, updateLocationDetails };
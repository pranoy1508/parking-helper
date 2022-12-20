const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const VehicleDetails =require("../models/vehicleDetails");

const onLoad = asyncHandler(async (req, res) => {
    let vehicleInfo = await mongoMiddleware.GetVehicleInformationByName(req.session.users_id.userName);
    if (vehicleInfo && vehicleInfo.length==0)
    {
        vehicleInfo=[];
        vehicleInfo.push(new VehicleDetails(req.session.users_id.userName));
    }
    let returnResponse={};
    returnResponse.vehicleInfo = vehicleInfo;
    res.render("pages/users/index", {
        items: returnResponse,
        groupName: "users"
    });
});

module.exports = { onLoad };
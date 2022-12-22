const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const ParkingDetails=require("../models/parkingDetails");
const ParkingLogs=require("../models/parkingLogs");
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
    loadDetails.userRole = req.session.users_id.userRole;
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

const executeReservation = asyncHandler(async(req,res)=>{
    const payload=req.body;
    let executionType="";
    if (payload.requestType==0)
    {
        await mongoMiddleware.UpdateParkingRequest(req.session.users_id.userName, payload.requestId,"REJECTED");
        executionType="Rejected";
    }
    else if (payload.requestType == 1)
    {
        executionType = "Accepted";
        const requestDetails = await mongoMiddleware.GetReservationDetailsById(payload.requestId);
        if (requestDetails)
        {
            const locationDetails = await mongoMiddleware.GetParkingDetails(requestDetails.locationId);
            const startDate = `${requestDetails.reservationDate}T00:00:00`;
            const endDate = `${requestDetails.reservationDate}T23:59:59`;
            const bookedCount = await mongoMiddleware.GetVehicleCountByType(requestDetails.vehicleType, requestDetails.locationId, startDate, endDate);
            const totalCount = requestDetails.vehicleType == 0 ? locationDetails.NoOfTwoWheelerParking : locationDetails.NoOfFourWheelerParking;
            if (totalCount - bookedCount >= requestDetails.vehicleCount)
            {
                await mongoMiddleware.UpdateParkingRequest(req.session.users_id.userName, payload.requestId, "ACCEPTED");
                for (let idx = 1; idx <= requestDetails.vehicleCount;idx++)
                {
                    let parkingLog={};
                    parkingLog.vehicleType = requestDetails.vehicleType;
                    parkingLog.vehicleNumber="N/A";
                    parkingLog.parkingLocation = requestDetails.locationId;
                    parkingLog.linkedRfidCard=null;
                    parkingLog.parkingDate = new Date(requestDetails.reservationDate);
                    parkingLog.createdBy="Park Whiz";
                    parkingLog.ownerName = requestDetails.employeeName && requestDetails.employeeName.trim() != "" ? requestDetails.employeeName:`Guest_${idx}`;
                    parkingLog.ownerId="N/A";
                    await ParkingLogs.create(parkingLog);
                }
            }
            else{
                res.json({ statusCode: 2022, message: `Requested parking spaces is more than available (${totalCount - bookedCount}) parking spaces.`})
            }
        }
    }
    return res.json({ statusCode: 200, message: `${executionType} the request successfully` });
    
});

module.exports = { onLoad, getParkingLocationsByOffice, getParkingDetails, updateLocationDetails, executeReservation };
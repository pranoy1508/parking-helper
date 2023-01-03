const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const ParkingDetails=require("../models/parkingDetails");
const ParkingLogs=require("../models/parkingLogs");
const _=require("lodash");
const emailMiddleware = require("../middleware/emailMiddleware");
const UserModel = require("../models/user.js");
const excelJs=require("exceljs");
const ReservationRequest = require("../models/reservationRequest");

const onLoad = asyncHandler(async (req, res) => {
    const fullDetails = await mongoMiddleware.GetFullOfficeLocations();
    const officeDetails = fullDetails.map(function ($loc) { return $loc["OfficeLocation"]; });
    const userDetails=await mongoMiddleware.GetAllUsers();
    let reservedDetails = await mongoMiddleware.GetReservationRequestByUserName(req.session.users_id.userName,5);
    for (let res of reservedDetails) {
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
    officeDetails.unshift("-- Please Select --");
    let loadDetails={};
    loadDetails.officeDetails = officeDetails;
    loadDetails.userDetails = userDetails;
    loadDetails.reservedDetails = reservedDetails;
    loadDetails.userRole = req.session.users_id.userRole;
    loadDetails.officeData = fullDetails;
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
        let requestDetails = await mongoMiddleware.GetReservationDetailsById(payload.requestId);
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
                const parkingDetails=await mongoMiddleware.GetFullOfficeLocations();
                parkingDetails.forEach(x=>{
                    if (x.ParkingLocations)
                    {
                        x.ParkingLocations.forEach(p=>{
                            if (p.LocationId == requestDetails.locationId)
                            {
                                requestDetails.officeName = x.OfficeLocation;
                                requestDetails.parkingName = p.LocationName;
                            }
                        })
                    }
                });
                const adminDetails = await UserModel.find({ userRole: "ADMIN" });
                const adminList = adminDetails.map(function ($u) { return $u["userName"]; }).join(',');
                const emailSubject = process.env.APPROVED_EMAIL_SUBJECT.replace('$requestId', requestDetails.uniqueId).replace("$date",new Date().toISOString().split("T")[0]);
                let emailBody = await createEmailBody(await emailMiddleware.GetEmailBodyTemplate("reservationApproved"), requestDetails, req.session.users_id.userName);
                emailMiddleware.TriggerEmail(adminList,emailSubject,emailBody);
            }
            else{
                res.json({ statusCode: 2022, message: `Requested parking spaces is more than available (${totalCount - bookedCount}) parking spaces.`})
            }
        }
    }
    return res.json({ statusCode: 200, message: `${executionType} the request successfully` });
    
});

const exportParkingLogs = asyncHandler(async (req, res) => {
    const allParkingLists = await mongoMiddleware.GetAllParkingLogs(req.query.startDate, req.query.endDate);
    const officeDetails = await mongoMiddleware.GetFullOfficeLocations();
    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("ParkingLogs");

    worksheet.columns = [
        { header: "Office Name", key: "office", width: 20 },
        { header: "Parking Location", key: "parkingLocation", width: 20 },
        { header: "Date", key: "reqDate", width: 20 },
        { header: "Emp Id", key: "empId", width: 20 },
        { header: "Emp Name", key: "empName", width: 20 },
        { header: "Vehicle Type", key: "vehicleType", width: 20 },
        { header: "Vehicle Number", key: "vehicleNumber", width: 20 },
        { header: "RFID", key: "rfid", width: 20 },
        { header: "In Time", key: "inTime", width: 50 }
    ];
    const itemCollection = await getExcelItemCollection(allParkingLists, officeDetails);
    worksheet.addRows(itemCollection);
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + `Logs.xlsx`
    );
    return workbook.xlsx.write(res).then(function () {
        res.status(200).end();
    });
});

const submitReservationRequest = asyncHandler(async (req, res) => {
    if (req.session.users_id.userRole == "ADMIN") {
        const reservationReq = req.body;
        if (new Date(reservationReq.reservationDate) < new Date()) {
            res.json({
                statusCode: 402,
                message: `Operation Not Allowed for Past Dates`
            });
        }

        const reservationRequest = new ReservationRequest(reservationReq.locationId, reservationReq.empName, reservationReq.vehicleType, reservationReq.vehicleCount, reservationReq.reservationDate, new Date(), req.session.users_id.userName);
        const reservationLogResponse = await mongoMiddleware.CreateParkingReservation(reservationRequest);
        if (reservationLogResponse) {
            const adminDetails = await UserModel.find({ userRole: "ADMIN" });
            const adminList = adminDetails.map(function ($u) { return $u["userName"]; }).join(',');
            const emailSubject = process.env.REQUEST_EMAIL_SUBJECT.replace('$date', reservationReq.reservationDate).replace("$requestId", reservationRequest.uniqueId);
            let emailBody = await emailMiddleware.GetEmailBodyTemplate("reservationApproval").replace('$date', reservationRequest.reservationDate).replace('$requestor', reservationRequest.requestedBy).replace('$office', reservationReq.officeLocation).replace('$location', reservationReq.location);
            emailMiddleware.TriggerEmail(adminList, emailSubject, emailBody);
        }
        res.json({
            statusCode: 201,
            message: `Successfully submitted the reservation request for ${reservationReq.reservationDate}`
        });
    }
    else {
        res.json({
            statusCode: 401,
            message: `Operation Not Allowed`
        });
    }

});

const exportUserLogs=asyncHandler(async(req,res)=>{
    let allUsersLists = await mongoMiddleware.GetAllUsers();
    const officeDetails = await mongoMiddleware.GetFullOfficeLocations();
    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("UserLogs");

    worksheet.columns = [
        { header: "UserName", key: "userName", width: 20 },
        { header: "Password", key: "userPassword", width: 20 },
        { header: "Role", key: "userRole", width: 20 },
        { header: "Location", key: "officeLocation", width: 20 },
        { header: "Action", key: "action", width: 20 },
    ];
    const userCollection = await getExcelUserData(allUsersLists, officeDetails);
    worksheet.addRows(userCollection);
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + `Users.xlsx`
    );
    return workbook.xlsx.write(res).then(function () {
        res.status(200).end();
    });

});



async function createEmailBody(stringBody, requestDetails,userName)
{
    return stringBody.replace("$requestId", requestDetails.uniqueId).replace("$admin", userName).replace("$date", new Date().toISOString().split("T")[0]).replace("$office", requestDetails.officeName).replace("$location", requestDetails.parkingName).replace("$resDate", requestDetails.reservationDate).replace("$vType", requestDetails.vehicleType == 0 ? "2 Wheeler" : "4 Wheeler").replace("$count", requestDetails.vehicleCount).replace("$requestorName", requestDetails.requestedBy);
}

async function getExcelItemCollection(allParkingLists, officeDetails)
{
    let excelData=[];
    allParkingLists.forEach(p=>{
        let item={};
        item.reqDate = p.parkingDate.toISOString().split("T")[0];
        item.empId = p.ownerName;
        item.empName = p.ownerId;
        item.vehicleType = p.vehicleType==0?"2 Wheeler":"4 Wheeler";
        item.vehicleNumber = p.vehicleNumber;
        item.rfid = p.linkedRfidCard;
        item.inTime = p.parkingDate.toISOString().split("T")[1];
        officeDetails.forEach(x => {
            if (x.ParkingLocations) {
                x.ParkingLocations.forEach(t => {
                    if (t.LocationId == p.parkingLocation) {
                        item.office = x.OfficeLocation;
                        item.parkingLocation = t.LocationName;
                    }
                })
            }
        });
        excelData.push(item);
    });
    return excelData;
}

async function getExcelUserData(allUsersData, officeDetails) {
    allUsersData.forEach(p => {
        p.officeLocation = p.locationId ? officeDetails.find(x => x.OfficeId == p.locationId).OfficeLocation:null;
        p.action=null;
    });
    return allUsersData;
}





module.exports = { onLoad, getParkingLocationsByOffice, getParkingDetails, updateLocationDetails, executeReservation, exportParkingLogs, submitReservationRequest, exportUserLogs };
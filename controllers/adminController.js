const asyncHandler = require("express-async-handler");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const ParkingDetails = require("../models/parkingDetails");
const ParkingLogs = require("../models/parkingLogs");
const _ = require("lodash");
const emailMiddleware = require("../middleware/emailMiddleware");
const UserModel = require("../models/user.js");
const excelJs = require("exceljs");
const ReservationRequest = require("../models/reservationRequest");

const onLoad = asyncHandler(async (req, res) => {
    const fullDetails = await mongoMiddleware.GetFullOfficeLocations();
    const officeDetails = fullDetails.map(function ($loc) { return $loc["OfficeLocation"]; });
    const userDetails = await mongoMiddleware.GetAllUsers();
    let reservedDetails = await mongoMiddleware.GetReservationRequestByUserName(req.session.users_id.userName);
    reservedDetails = _.filter(reservedDetails, (res) => { return (new Date(res.reservationDate) >= new Date().setHours(0, 0, 0, 0)) });
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
    let loadDetails = {};
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
    return res.json({ statusCode: 200, message: "Updated Successfully" });
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
        if (new Date(reservationReq.reservationDate) < new Date().setHours(0, 0, 0, 0)) {
            return res.json({
                statusCode: 402,
                message: `Operation Not Allowed for Past Dates`
            });
        }
        const reservationRequest = new ReservationRequest(reservationReq.locationId, reservationReq.empName, reservationReq.vehicleType, reservationReq.vehicleCount, reservationReq.reservationDate, new Date(), req.session.users_id.userName);
        const isReservationAllowedRes = await isReservationAllowed(reservationRequest);
        if (!isReservationAllowedRes)
        {
            return res.json({
                statusCode: 402,
                message: `All parking spaces are full for ${reservationReq.reservationDate}`
            });
        }
        const parkingLogResponse = await createReservationParkingLog(reservationReq, req.session.users_id.userName);
        if (parkingLogResponse == true) {
            const reservationLogResponse = await mongoMiddleware.CreateParkingReservation(reservationRequest);
            if (reservationLogResponse) {
                const adminDetails = await UserModel.find({ userRole: "ADMIN" });
                const adminList = adminDetails.map(function ($u) { return $u["userName"]; }).join(',');
                const emailSubject = process.env.RESERVATION_EMAIL_SUBJECT.replace('$date', reservationReq.reservationDate).replace("$requestId", reservationRequest.uniqueId);
                const emailBody = await getReservationEmailBody(await emailMiddleware.GetEmailBodyTemplate("reservationCreated"), reservationRequest, reservationReq);
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
                message: `No available parking space for the date ${reservationReq.reservationDate}`
            });
        }

    }
    else {
        res.json({
            statusCode: 401,
            message: `Operation Not Allowed`
        });
    }

});

const exportUserLogs = asyncHandler(async (req, res) => {
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

const cancelParkingRequest=asyncHandler(async(req,res)=>{
    const {id} = req.body;
    const reservationRequestDetails=await mongoMiddleware.GetReservationDetailsById(id);
    const officeDetailsList=await mongoMiddleware.GetFullOfficeLocations();
    let officeObj={};
    officeDetailsList.forEach(x=>{
        if (x.ParkingLocations && x.ParkingLocations.length>0)
        {
            x.ParkingLocations.forEach(p=>{
                if (p.LocationId == reservationRequestDetails.locationId)
                {
                    officeObj.officeLocation = x.OfficeLocation;
                    officeObj.location = p.LocationName;
                }
            });
        }
    });
    const startDate = `${reservationRequestDetails.reservationDate}T00:00:00`;
    const endDate = `${reservationRequestDetails.reservationDate}T23:59:59`;
    await mongoMiddleware.UpdateParkingRequest(req.session.users_id.userName, id,"CANCELLED");
    await mongoMiddleware.RemoveParkingDetails(reservationRequestDetails.guestName, startDate,endDate, reservationRequestDetails.locationId);
    const adminDetails = await UserModel.find({ userRole: "ADMIN" });
    const adminList = adminDetails.map(function ($u) { return $u["userName"]; }).join(',');
    const emailSubject = process.env.CANCELLED_EMAIL_SUBJECT.replace('$date', reservationRequestDetails.reservationDate).replace("$requestId", reservationRequestDetails.uniqueId);
    const emailBody = await getReservationEmailBody(await emailMiddleware.GetEmailBodyTemplate("reservationCancelled"), reservationRequestDetails, officeObj);
    emailMiddleware.TriggerEmail(adminList, emailSubject, emailBody);
    res.json({
        statusCode: 200,
        message: `Request ${reservationRequestDetails.uniqueId} cancelled successfully.`
    });
});

const searchReservation=asyncHandler(async(req,res)=>{
    const reservationId = req.query.id;
    let reservationDetails = await mongoMiddleware.GetReservationDetailsByUniqueId(reservationId);
    const officeDetails = await mongoMiddleware.GetFullOfficeLocations();
    const linkedOffice = _.find(officeDetails, (office) => {
        if (office.ParkingLocations) {
            const contextParking = _.find(office.ParkingLocations, ($p) => {
                if ($p.LocationId == reservationDetails.locationId) {
                    reservationDetails.parkingLocation = $p.LocationName;
                    return true;
                }
            });
            return contextParking;
        }
    });
    reservationDetails.officeLocation = linkedOffice ? linkedOffice.OfficeLocation : null;
    reservationDetails.isSelfOwned = reservationDetails.requestedBy == req.session.users_id.userName;
    const result={};
    result.reservedDetails = [reservationDetails];
    res.render("pages/admin/partials/_requestViewPartial", {
        items: result,
        groupName: "admin",
        layout: false
    });
});

async function getExcelItemCollection(allParkingLists, officeDetails) {
    let excelData = [];
    allParkingLists.forEach(p => {
        let item = {};
        item.reqDate = p.parkingDate.toISOString().split("T")[0];
        item.empId = p.ownerName;
        item.empName = p.ownerId;
        item.vehicleType = p.vehicleType == 0 ? "2 Wheeler" : "4 Wheeler";
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
        p.officeLocation = p.locationId ? officeDetails.find(x => x.OfficeId == p.locationId).OfficeLocation : null;
        p.action = null;
    });
    return allUsersData;
}

async function createReservationParkingLog(reservationReq, userName) {
    let parkingLogged = false;
    const locationDetails = await mongoMiddleware.GetParkingDetails(reservationReq.locationId);
    const startDate = `${reservationReq.reservationDate}T00:00:00`;
    const endDate = `${reservationReq.reservationDate}T23:59:59`;
    const bookedCount = await mongoMiddleware.GetVehicleCountByType(reservationReq.vehicleType, reservationReq.locationId, startDate, endDate);
    const totalCount = reservationReq.vehicleType == 0 ? locationDetails.NoOfTwoWheelerParking : locationDetails.NoOfFourWheelerParking;
    if (totalCount - bookedCount >= reservationReq.vehicleCount) {
        for (let idx = 1; idx <= reservationReq.vehicleCount; idx++) {
            let parkingLog = {};
            parkingLog.vehicleType = reservationReq.vehicleType;
            parkingLog.vehicleNumber = "N/A";
            parkingLog.parkingLocation = reservationReq.locationId;
            parkingLog.linkedRfidCard = null;
            parkingLog.parkingDate = new Date(reservationReq.reservationDate);
            parkingLog.createdBy = userName;
            parkingLog.ownerName = reservationReq.empName && reservationReq.empName.trim() != "" ? reservationReq.empName : `Guest_${idx}`;
            parkingLog.ownerId = "N/A";
            await ParkingLogs.create(parkingLog);
            parkingLogged = true;
        }
    }
    return parkingLogged;
}

async function getReservationEmailBody(template, reservationRequest, payload) {
    return template.replace('$date', reservationRequest.createdDate).replace('$requestorName', reservationRequest.requestedBy).replace('$office', payload.officeLocation).replace('$location', payload.location).replace("$requestId", reservationRequest.uniqueId).replace("$resDate", reservationRequest.reservationDate).replace("$vType", reservationRequest.vehicleType == 0 ? "2 Wheeler" : "4 Wheeler").replace("$count", reservationRequest.vehicleCount);
}

async function isReservationAllowed(reservationReq) {
    const sysDate = new Date().toISOString().split('T')[0];
    const startDate = `${sysDate}T00:00:00`;
    const endDate = `${sysDate}T23:59:59`;
    const locationDetails = await mongoMiddleware.GetParkingDetails(reservationReq.locationId);
    const bookedCount = await mongoMiddleware.GetVehicleCountByType(reservationReq.vehicleType, reservationReq.locationId, startDate, endDate);
    const totalCount = reservationReq.vehicleType == 0 ? locationDetails.NoOfTwoWheelerParking : locationDetails.NoOfFourWheelerParking;
    return (totalCount - bookedCount >0);
}





module.exports = { onLoad, getParkingLocationsByOffice, getParkingDetails, updateLocationDetails, exportParkingLogs, submitReservationRequest, exportUserLogs, cancelParkingRequest, searchReservation };
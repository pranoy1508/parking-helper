const mongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;

module.exports.GetParkingLocationsByOffice = async (officeName) => {
    let parkingLocationsDetails = null;
    try {
        const query = { "OfficeLocation": officeName };
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        parkingLocationsDetails = await dbo.collection(process.env.LOCATIONS_COLLECTIONS_NAME).findOne(query);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return parkingLocationsDetails.ParkingLocations;
}

module.exports.GetParkingDetails = async (locationId) => {
    let parkingDetails = null;
    try {
        const query = { "LocationId": locationId };
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        parkingDetails = await dbo.collection(process.env.PARKING_INFO).findOne(query);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return parkingDetails;
}

module.exports.UpdateParkingDetails = async (payload) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        mongoResult = await dbo.collection(process.env.PARKING_INFO).findOneAndUpdate(
            { LocationId: payload.locationId },
            {
                $set:
                {
                    "NoOfTwoWheelerParking": parseInt(payload.twoWheelerCount),
                    "NoOfFourWheelerParking": parseInt(payload.fourWheelerCount),
                    "UpdatedAt": new Date(),
                    "UpdatedBy": payload.user
                }
            }
        );
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}

module.exports.CreateParkingDetails = async (payload) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        mongoResult = await dbo.collection(process.env.PARKING_INFO).insert(payload);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}

module.exports.GetAllUsers = async () => {
    let userDetails = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        userDetails = await dbo.collection(process.env.USERS_COLLECTIONS_NAME).find().toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return userDetails;
}

module.exports.CreateParkingLog = async (payload) => {
    let parkingLogResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        parkingLogResult = await dbo.collection(process.env.PARKING_LOGS_COLLECTIONS_NAME).insert(payload);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return parkingLogResult;
}

module.exports.GetFullOfficeLocations = async () => {
    let officeLocationDetails = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        officeLocationDetails = await dbo.collection(process.env.LOCATIONS_COLLECTIONS_NAME).find().toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return officeLocationDetails;
}

module.exports.GetVehicleCountByType = async (_vehicleType, _locationId, startDate, endDate) => {
    let vehicleCount = 0;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        const query = {
            vehicleType: _vehicleType, parkingLocation: _locationId, parkingDate:
            {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        vehicleCount = await dbo.collection(process.env.PARKING_LOGS_COLLECTIONS_NAME).countDocuments(query);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return vehicleCount;
}

module.exports.GetAllVehicleInformation = async () => {
    let vehicleDetails = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        vehicleDetails = await dbo.collection(process.env.VEHICLE_DETAILS_COLLECTION_NAME).find().toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return vehicleDetails;
}

module.exports.GetVehicleInformationByName = async (userName) => {
    let vehicleDetails = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        const query = { "ownerName": userName };
        vehicleDetails = await dbo.collection(process.env.VEHICLE_DETAILS_COLLECTION_NAME).find(query).sort({ vehicleType: 1 }).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return vehicleDetails;
}

module.exports.CreateParkingReservation = async (payload) => {
    let reservationLog = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        reservationLog = await dbo.collection(process.env.RESERVATIONS_COLLECTION_NAME).insert(payload);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return reservationLog;
}

module.exports.GetParkingRequestsByUserName = async (userName, _limit) => {
    let reservationLog = null;
    try {
        const query = { "requestedBy": userName };
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        const sort = { reservationDate: 1 };
        reservationLog = await dbo.collection(process.env.RESERVATIONS_COLLECTION_NAME).find(query).limit(_limit).sort(sort).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return reservationLog;
}

module.exports.GetPendingParkingRequests = async (_limit) => {
    let reservationLog = null;
    try {
        const query = { "status": "PENDING" };
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        const sort = { reservationDate: 1 };
        reservationLog = await dbo.collection(process.env.RESERVATIONS_COLLECTION_NAME).find(query).limit(_limit).sort(sort).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return reservationLog;
}

module.exports.UpdateParkingRequest = async (userName, requestId, status) => {
    let rejectionResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        rejectionResult = await dbo.collection(process.env.RESERVATIONS_COLLECTION_NAME).updateOne(
            { "_id": new ObjectId(requestId) },
            {
                $set: {
                    "updatedBy": userName,
                    "status": status,
                    "modifiedDate": new Date()
                }
            }
        );
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return rejectionResult;
}

module.exports.GetReservationDetailsById = async (requestId) => {
    let reservationDetails = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        reservationDetails = await dbo.collection(process.env.RESERVATIONS_COLLECTION_NAME).findOne({ "_id": new ObjectId(requestId) });
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return reservationDetails;
}

module.exports.GetAllParkingLogs = async (_startDate, _endDate) => {
    var result = null;
    try {
        const startDate = `${_startDate}T00:00:00`;
        const endDate = `${_endDate}T23:59:59`;
        const query = {
            parkingDate:
            {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        result = await dbo.collection(process.env.PARKING_LOGS_COLLECTIONS_NAME).find(query).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return result;
}

module.exports.RegisterVehicle = async (payload) => {
    var result = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        const exitingDetails = await dbo.collection(process.env.VEHICLE_DETAILS_COLLECTION_NAME).findOne({ "ownerName": payload.ownerName, "vehicleType": payload.vehicleType });
        if (exitingDetails) {
            result = await dbo.collection(process.env.VEHICLE_DETAILS_COLLECTION_NAME).updateOne(
                { "ownerName": payload.ownerName, "vehicleType": payload.vehicleType },
                {
                    $set: {
                        vehicleNumber: payload.vehicleNumber
                    }
                }
            );
        }
        else {
            result = await dbo.collection(process.env.VEHICLE_DETAILS_COLLECTION_NAME).insert(payload);
        }
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return result;
}

module.exports.GetReservationRequestByUserName = async (userName) => {
    let reservationLog = null;
    try {
        const query = { "requestedBy": userName, "status": "BOOKED" };
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        const sort = { reservationDate: 1 };
        reservationLog = await dbo.collection(process.env.RESERVATIONS_COLLECTION_NAME).find(query).sort(sort).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return reservationLog;
}

module.exports.RemoveVehicleDetailsByUserName = async (userName) => {
    try {
        const query = { "ownerName": userName };
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        await dbo.collection(process.env.VEHICLE_DETAILS_COLLECTION_NAME).deleteMany(query);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
}

module.exports.RemoveParkingDetails = async (ownerName, startDate,endDate, parkingLocation) => {
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        const query = { "ownerName": ownerName, "parkingDate": { $gte:new Date(startDate), $lt:new Date(endDate)}, "parkingLocation": parkingLocation };
        mongoResult = await dbo.collection(process.env.PARKING_LOGS_COLLECTIONS_NAME).deleteMany(query);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
}
module.exports.GetReservationDetailsByStatus = async (status,queryDate) => {
    let reservationDetails = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        const query = { "reservationDate": queryDate, "status":status};
        reservationDetails = await dbo.collection(process.env.RESERVATIONS_COLLECTION_NAME).find(query).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return reservationDetails;
}

module.exports.GetReservationDetailsByUniqueId = async (requestId) => {
    let reservationDetails = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        reservationDetails = await dbo.collection(process.env.RESERVATIONS_COLLECTION_NAME).findOne({ "uniqueId": requestId });
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return reservationDetails;
}


module.exports.GetAllUsersByType = async (_type) => {
    let userDetails = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        userDetails = await dbo.collection(process.env.USERS_COLLECTIONS_NAME).find({ "userRole":{$in:_type } }).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return userDetails;
}

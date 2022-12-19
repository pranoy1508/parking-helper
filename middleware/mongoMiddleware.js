const mongoClient = require("mongodb").MongoClient;

module.exports.GetAllOfficeLocations = async () => {
    let officeLocationDetails=null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.DB_NAME);
        officeLocationDetails = await dbo.collection(process.env.LOCATIONS_COLLECTIONS_NAME).find().toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return officeLocationDetails.map(function ($loc) { return $loc["OfficeLocation"]; });
}

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

module.exports.GetParkingDetails=async(locationId)=>
{
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

module.exports.UpdateParkingDetails=async(payload)=>{
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
                    "UpdatedAt":new Date(),
                    "UpdatedBy":payload.user
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

module.exports.CreateParkingDetails=async(payload)=>{
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

module.exports.GetAllUsers=async()=>{
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
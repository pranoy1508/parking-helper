const mongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectId;
module.exports.GetCronLogs = async (pgNo, type, cronId) => {
    let query = {}
    if (type) {
        switch (type) {
            case 'Manual':
                query['type'] = 'Manual'
                break
            case 'Regular':
                query['type'] = { $ne: 'Manual' }
                break
            case 'All':
                break
            default:
                break
        }
    }
    if (cronId != '') {
        query['cronId'] = cronId
    }
    let mongoResult = null, pageSize = 0, pageNumber = 0, totalDocs = 0, totalPages = 0;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);

        pageSize = parseInt(process.env.CRON_PAGESIZE)
        pageNumber = pgNo || 0
        totalDocs = await dbo.collection(process.env.GET_CRON_LOGS_COLLECTION_NAME).countDocuments(query)
        totalPages = Math.ceil(totalDocs / pageSize)
        mongoResult = await dbo.collection(process.env.GET_CRON_LOGS_COLLECTION_NAME).find(query).sort({ $natural: -1 }).skip(pageNumber * pageSize).limit(pageSize).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return { mongoResult, pageNumber, pageSize, totalDocs, totalPages };
}

module.exports.GetItemList = async (mpId) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        let dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);

        const query = { "mpid": mpId };
        mongoResult = await dbo.collection(process.env.ITEMS_COLLECTION_NAME).find(query).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}

module.exports.UpdateCronLogPostPriceUpdate = async (req) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        let dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        mongoResult = await dbo.collection(process.env.GET_CRON_LOGS_COLLECTION_NAME).findOneAndUpdate(
            { _id: req._id },
            {
                $set: {
                    logs: req.logs
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

module.exports.GetLogsById = async (id) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        let dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        const query = { "_id": ObjectID(id) };
        mongoResult = await dbo.collection(process.env.GET_CRON_LOGS_COLLECTION_NAME).find(query).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}

module.exports.GetLatestCronStatus = async () => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        let dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        const query = { "status": "In-Progress" };
        mongoResult = await dbo.collection(process.env.CRON_STATUS_COLLECTION_NAME).find(query).sort({ _id: -1 }).toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}

module.exports.PushManualCronLogAsync = async (payload) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        mongoResult = await dbo.collection(process.env.GET_CRON_LOGS_COLLECTION_NAME).insertOne(payload);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;

}

module.exports.GetCronSettingsList = async () => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        let dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        mongoResult = await dbo.collection(process.env.CRON_SETTINGS_COLLECTION_NAME).find().toArray();
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}

module.exports.UpdateCronSettingsList = async (payload) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        let dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        for (const element of payload) {
            mongoResult = await dbo.collection(process.env.CRON_SETTINGS_COLLECTION_NAME).findOneAndUpdate(
                { CronId: element.CronId },
                {
                    $set:
                    {
                        "CronName": element.CronName,
                        "CronTime": element.CronTime,
                        "CronTimeUnit": element.CronTimeUnit,
                        "SecretKey": element.SecretKey,
                        //"CreatedTime": element.CreatedTime,
                        //"UpdatedTime": element.UpdatedTime,
                        //"CronStatus": element.CronStatus
                    }
                }
            );
        }
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}

module.exports.InsertCronSettings = async (payload) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        var dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        mongoResult = await dbo.collection(process.env.CRON_SETTINGS_COLLECTION_NAME).insertOne(payload);
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;

}

module.exports.ToggleCronStatus = async (cronId, cronStatus) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        let dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        mongoResult = await dbo.collection(process.env.CRON_SETTINGS_COLLECTION_NAME).findOneAndUpdate(
            { CronId: cronId },
            {
                $set:
                {
                    "CronStatus": cronStatus
                }
            }
        );
        if (cronStatus == true) {
            mongoResult = await dbo.collection(process.env.CRON_SETTINGS_COLLECTION_NAME).findOneAndUpdate(
                { CronId: cronId },
                {
                    $set:
                    {
                        "UpdatedTime": new Date()
                    }
                }
            );
        }
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}

module.exports.PurgeCronBasedOnId = async (cronId) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        let dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        mongoResult = await dbo.collection(process.env.GET_CRON_LOGS_COLLECTION_NAME).deleteMany({ 'cronId': cronId });
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}

module.exports.PurgeCronBasedOnDate = async (dateString) => {
    let mongoResult = null;
    try {
        const dbConnection = await mongoClient.connect(process.env.DATABASE_URL);
        let dbo = dbConnection.db(process.env.GET_REPRICER_DBNAME);
        mongoResult = await dbo.collection(process.env.GET_CRON_LOGS_COLLECTION_NAME).deleteMany({
            time: {
                $lte: new Date(dateString)
            }
        });
        dbConnection.close();
    }
    catch (exception) {
        console.log(exception);
    }
    return mongoResult;
}
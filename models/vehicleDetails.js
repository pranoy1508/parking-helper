class VehicleDetails {
    constructor(userName,empId,vehicleType,vehicleNumber) {
        this.ownerEmployeeId = empId;
        this.ownerName = userName;
        this.vehicleType = vehicleType;
        this.vehicleNumber = vehicleNumber;
    }

}
module.exports = VehicleDetails;
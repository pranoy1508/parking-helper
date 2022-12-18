class ParkingDetails {
    constructor(payload) {
        this.LocationId = payload.locationId;
        this.NoOfTwoWheelerParking = parseInt(payload.twoWheelerCount);
        this.NoOfFourWheelerParking = parseInt(payload.fourWheelerCount);
        this.UpdatedAt = new Date();
        this.UpdatedBy = payload.user;
    }

}
module.exports = ParkingDetails;
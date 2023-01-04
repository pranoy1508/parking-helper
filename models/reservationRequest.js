const passwordGen = require("generate-password");
class ReservationRequest {
    constructor(_locationId,_guestName, _vehicleType, _vehicleCount, _reservationDate, _createdDate,_requestedBy) {
        this.locationId = _locationId;
        this.guestName = _guestName;
        this.vehicleType = parseInt(_vehicleType);
        this.vehicleCount=parseInt(_vehicleCount);
        this.reservationDate = _reservationDate;
        this.createdDate=_createdDate,
        this.requestedBy=_requestedBy;
        this.modifiedDate=new Date();
        this.updatedBy=null;
        this.status="BOOKED";
        this.uniqueId = "PH-"+ passwordGen.generate({
            length: 10,
            numbers: true,
            uppercase:true,
            lowercase:false
        });
    }
    updateStatus(_status)
    {
        this.status=_status;
        this.modifiedDate=new Date();
    }

}
module.exports = ReservationRequest;
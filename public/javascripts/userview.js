function availableParkingLocationChanged(items) {
    const officeDetails = JSON.parse(items);
    const parkingLocationId = $("#parking_location_ddl_usr").val();
    const officeLocation = $("#location_ddl_sec").val();
    let contextLocationDetails = null;
    officeDetails.forEach(loc => {
        if (loc.OfficeLocation == officeLocation && loc.ParkingLocations && loc.ParkingLocations.length > 0) {
            loc.ParkingLocations.forEach($opt => {
                if ($opt.LocationId == parkingLocationId) {
                    contextLocationDetails = $opt;
                }
            });
        }
    });
    if (contextLocationDetails) {
        $("#totTwoLbl").val(contextLocationDetails.TotalTwoWheelerCount);
        $("#avlTwoLbl").val(contextLocationDetails.TotalTwoWheelerCount - contextLocationDetails.BookedTwoWheelerCount);
        $("#totFourLbl").val(contextLocationDetails.TotalFourWheelerCount);
        $("#avlFourLbl").val(contextLocationDetails.TotalFourWheelerCount - contextLocationDetails.BookedFourWheelerCount);
        $("#dtl_two_wheeler").html("");
        $("#dtl_four_wheeler").html("");
        $("#dtl_two_wheeler").html(getParkingInfoTemplate(contextLocationDetails, 0));
        $("#dtl_four_wheeler").html(getParkingInfoTemplate(contextLocationDetails, 1));
    }
}

function getParkingInfoTemplate(item, typeOfVehicle) {
    const totalCount = typeOfVehicle == 0 ? item.TotalTwoWheelerCount : item.TotalFourWheelerCount;
    const bookedCount = typeOfVehicle == 0 ? item.BookedTwoWheelerCount : item.BookedFourWheelerCount;
    let htmlString = "";
    let bookedTwoValue = 0;
    for (let idx = 0; idx <= totalCount; idx++) {
        if (idx % 20 == 0) {
            htmlString += "<br/>";
        }
        else if (bookedTwoValue < bookedCount) {
            htmlString += " <i class='fas fa-parking' style='font-size:48px;color:green'></i> ";
            bookedTwoValue++;
        }
        else {
            htmlString += " <i class='fas fa-parking' style='font-size:48px;color:#8080809c'></i> ";
        }
    }
    return htmlString;
}
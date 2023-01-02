function availableParkingLocationChanged(items) {
    const officeDetails = JSON.parse(items);
    const parkingLocationId = $("#parking_location_ddl_usr").val();
    const officeLocation = $("#location_ddl_sec").val();
    const dateForExtraction = $('#parkingInfoDate').val();
    if (dateForExtraction==new Date().toISOString().split("T")[0])
    {
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
        updateParkingInfoView(contextLocationDetails);
    }
    else 
    {
        $.ajax({
            type: "POST",
            url: `/dashboard/get_availability`,
            cache: false,
            data: { "locationId": parkingLocationId, "requestedData": dateForExtraction },
            dataType: "json",
            beforeSend: function () {
                showLoadingToast("Getting Location details...");
            },
            success: function (data) {
                showSuccessToast("Success");
                updateParkingInfoView(data);
            },
            error: function () {
                showErrorToast("Something went wrong. Please try again");
            },
        });
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
            htmlString += " <i class='fas fa-parking' style='font-size:48px;color:red'></i> ";
            bookedTwoValue++;
        }
        else {
            htmlString += " <i class='fas fa-parking' style='font-size:48px;color:green'></i> ";
        }
    }
    return htmlString;
}

function updateParkingInfoView(contextLocationDetails)
{
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


function autoPopulateEmployeeId(item)
{
    $('[name="reg_empId_Two"]').val(item.value);
    $('[name="reg_empId_Four"]').val(item.value);
}
function saveVehicleDetails()
{
    const userId = $('[name="reg_empId_Two"]').val();
    const twoWheelerNo = $('[name="reg_vehicleNumber_Two"]').val();
    const fourWheelerNo = $('[name="reg_vehicleNumber_Four"]').val();
    let payload={};
    payload.userId = $('[name="reg_empId_Two"]').val();
    if (twoWheelerNo && twoWheelerNo.trim()!="")
    {
        payload.twoWheelerNo = twoWheelerNo;
    }
    if (fourWheelerNo && fourWheelerNo.trim() != "") {
        payload.fourWheelerNo = fourWheelerNo;
    }
    $.ajax({
        type: "POST",
        url: `/dashboard/registerVehicle`,
        cache: false,
        data: payload,
        dataType: "json",
        beforeSend: function () {
            showLoadingToast("Registering...");
        },
        success: function (data) {
            showSuccessToast("Success");
            location.reload();
        },
        error: function () {
            showErrorToast("Something went wrong. Please try again");
        },
    });
}
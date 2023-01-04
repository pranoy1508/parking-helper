function showSuccessToast(msg) {
    $.toast().reset('all');
    $.toast({
        text: msg,
        allowToastClose: true,
        hideAfter: 1000,
        showHideTransition: 'fade',
        icon: 'success',
        textAlign: 'left',
        position: 'top-right'

    });
}

function showLoadingToast(msg) {
    $.toast().reset('all');
    $.toast({
        text: msg,
        allowToastClose: true,
        hideAfter: 3000,
        showHideTransition: 'fade',
        icon: 'info',
        textAlign: 'left',
        position: 'top-right'

    });
}

function showErrorToast(msg) {
    $.toast().reset('all');
    $.toast({
        text: msg,
        allowToastClose: true,
        hideAfter: 3000,
        showHideTransition: 'fade',
        icon: 'error',
        textAlign: 'left',
        position: 'top-right'

    });
}

$('.minDatePicker').datepicker({
    dateFormat: "yy-mm-dd",
    changeYear: true,
    minDate: 0,
    yearRange: '-0:+1'
});

$('.endDatePicker').datepicker({
    dateFormat: "yy-mm-dd",
    changeYear: true
});

function locationSelectionChanged(item) {
    $('#details_div').addClass("d-none");
    if (item.value == "-- Please Select --") {
        $('#parking_location_ddl').empty();
    } else {
        $.ajax({
            type: "POST",
            url: `/admin/get_parking_locations`,
            cache: false,
            data: { "officeLocation": item.value },
            dataType: "json",
            beforeSend: function () {
                showLoadingToast("Getting Location details...");
            },
            success: function (data) {
                showSuccessToast("Success");
                $('#parking_location_ddl').empty();
                data.forEach($opt => {
                    if ($opt.IsActive == true) {
                        $('#parking_location_ddl').append(new Option($opt.LocationName, $opt.LocationId));
                    }
                });
            },
            error: function () {
                showErrorToast("Something went wrong. Please try again");
            },
        });
    }

}

function getParkingDetails() {
    let locationId = $('#parking_location_ddl').val();
    $.ajax({
        type: "POST",
        url: `/admin/get_location_details`,
        cache: false,
        data: { "locationId": locationId },
        dataType: "json",
        beforeSend: function () {
            showLoadingToast("Getting parking details...");
        },
        success: function (data) {
            showSuccessToast("Success");
            $('#lblLocation').text($("#parking_location_ddl option:selected").text());
            $('#details_div').removeClass("d-none");
            $('#details_div_date').addClass("d-none");
            $('[name="txtTwoWheelerCount"]').val(data && data.NoOfTwoWheelerParking ? parseInt(data.NoOfTwoWheelerParking) : 0);
            $('[name="txtFourWheelerCount"]').val(data && data.NoOfFourWheelerParking ? parseInt(data.NoOfFourWheelerParking) : 0);
        },
        error: function () {
            showErrorToast("Something went wrong. Please try again");
        },
    });
}

function editWheelerCount(wheelerCount) {
    if (wheelerCount == 2) {
        $('[name="btnSaveTwo"]').removeClass("d-none");
        $('[name="btnCancelTwo"]').removeClass("d-none");
        $('[name="btnEditTwo"]').addClass("d-none");
        $('[name="txtTwoWheelerCount"]').removeAttr("readonly");
    }
    else if (wheelerCount == 4) {
        $('[name="btnSaveFour"]').removeClass("d-none");
        $('[name="btnCancelFour"]').removeClass("d-none");
        $('[name="btnEditFour"]').addClass("d-none");
        $('[name="txtFourWheelerCount"]').removeAttr("readonly");
    }
}

function saveWheelerCount() {
    const locationId = $('#parking_location_ddl').val();
    const twoWheelerCount = $('[name="txtTwoWheelerCount"]').val();
    const fourWheelerCount = $('[name="txtFourWheelerCount"]').val();
    $.ajax({
        type: "POST",
        url: `/admin/update_location_details`,
        cache: false,
        data: { "locationId": locationId, "twoWheelerCount": twoWheelerCount, "fourWheelerCount": fourWheelerCount },
        dataType: "json",
        beforeSend: function () {
            showLoadingToast("Updating parking details...");
        },
        success: function (data) {
            showSuccessToast(data.message);
            cancelWheeler(2);
            cancelWheeler(4);
        },
        error: function () {
            showErrorToast("Something went wrong. Please try again");
        },
    });
}

function cancelWheeler(wheelerCount) {
    if (wheelerCount == 2) {
        $('[name="btnSaveTwo"]').addClass("d-none");
        $('[name="btnCancelTwo"]').addClass("d-none");
        $('[name="btnEditTwo"]').removeClass("d-none");
        $('[name="txtTwoWheelerCount"]').attr("readonly", true);
    }
    else if (wheelerCount == 4) {
        $('[name="btnSaveFour"]').addClass("d-none");
        $('[name="btnCancelFour"]').addClass("d-none");
        $('[name="btnEditFour"]').removeClass("d-none");
        $('[name="txtFourWheelerCount"]').attr("readonly", true);
    }
    getParkingDetails();

}

function addUser() {
    $('[name="div_add_user"]').removeClass("d-none");
}

function cancelUserAddition() {
    $('[name="div_add_user"]').addClass("d-none");
}

function saveUser() {
    const userName = $('[name="add_userName"]').val();
    const role = $('[name="add_user_role"]').val();
    $.ajax({
        type: "POST",
        url: `/user/add_user`,
        cache: false,
        data: { "userName": userName, "role": role },
        dataType: "json",
        beforeSend: function () {
            showLoadingToast("Adding user details...");
        },
        success: function (data) {
            if (data.statusCode == 2020 || data.statusCode == 2021) {
                showErrorToast(data.message);
            }
            else {
                showSuccessToast(data.message);
                location.reload();
            }
        },
        error: function () {
            showErrorToast("Something went wrong. Please try again");
        },
    });
}

function locationSelectionUpdatedForRes(ddlOption, items) {
    const contextParkingDetails = JSON.parse(items);
    contextParkingDetails.forEach(loc => {
        if (loc.OfficeLocation == ddlOption.value && loc.ParkingLocations && loc.ParkingLocations.length > 0) {
            loc.ParkingLocations.forEach($opt => {
                if ($opt.IsActive == true) {
                    $('#parking_location_ddl_res').append(new Option($opt.LocationName, $opt.LocationId));
                }
            });
        }
    });
}

function locationSelectionUpdated(ddlOption, items) {
    const contextParkingDetails = JSON.parse(items);
    contextParkingDetails.forEach(loc => {
        if (loc.OfficeLocation == ddlOption.value && loc.ParkingLocations && loc.ParkingLocations.length > 0) {
            loc.ParkingLocations.forEach($opt => {
                if ($opt.IsActive == true) {
                    $('#parking_location_ddl_sec').append(new Option($opt.LocationName, $opt.LocationId));
                }
            });
        }
    });
}

function parkingSelectionChanged(ddlOption, items) {
    const contextParkingDetails = JSON.parse(items);
    contextParkingDetails.forEach(loc => {
        if (loc.ParkingLocations && loc.ParkingLocations.length > 0) {
            loc.ParkingLocations.forEach($p => {
                if ($p.LocationId == ddlOption.value) {
                    $('[name="secTxtTwoWheelerCount"]').val($p.TotalTwoWheelerCount);
                    $('[name="secTxtFourWheelerCount"]').val($p.TotalFourWheelerCount);
                    $('[name="secTxtAvlTwoWheelerCount"]').val($p.AvailableTwoWheelerCount);
                    $('[name="secTxtAvlFourWheelerCount"]').val($p.AvailableFourWheelerCount);
                }
            });
        }
    });
    validateAddition(contextParkingDetails);
}

function parkingSelectionChangedForRes(ddlOption, items) {
    const contextParkingDetails = JSON.parse(items);
    contextParkingDetails.forEach(loc => {
        if (loc.ParkingLocations && loc.ParkingLocations.length > 0) {
            loc.ParkingLocations.forEach($p => {
                if ($p.LocationId == ddlOption.value) {
                    $('[name="resTxtTwoWheelerCount"]').val($p.TotalTwoWheelerCount);
                    $('[name="resTxtFourWheelerCount"]').val($p.TotalFourWheelerCount);
                    $('[name="resTxtAvlTwoWheelerCount"]').val($p.AvailableTwoWheelerCount);
                    $('[name="resTxtAvlFourWheelerCount"]').val($p.AvailableFourWheelerCount);
                }
            });
        }
    });
    validateAddition(contextParkingDetails);
}

function saveParkingLog(vehicleStr) {
    const contextVehicleDetails = JSON.parse(vehicleStr);
    let parkingLog = {};
    parkingLog.empId = $('#sec_empid').val();
    parkingLog.empName = $('#sec_empName').val();
    parkingLog.vehicleNumber = $('#sec_vehicleNo').val();
    parkingLog.vehicleType = $('#sec_vehicleType').val();
    parkingLog.rfid = $('#sec_rfidNo').val();
    parkingLog.parkingLocation = $('#parking_location_ddl_sec').val();
    contextVehicleDetails.forEach(vehicle => {
        if (vehicle.ownerEmployeeId == parkingLog.empId) {
            parkingLog.vehicleNumber = vehicle.vehicleNumber;
        }
    });
    $.ajax({
        type: "POST",
        url: `/parking/create_parking_log`,
        cache: false,
        data: parkingLog,
        dataType: "json",
        beforeSend: function () {
            showLoadingToast("Adding details...");
        },
        success: function (data) {
            if (data.statusCode == 4021 || data.statusCode == 4022 || data.statusCode == 4023 || data.statusCode == 4044) {
                showErrorToast(data.message);
            }
            else {
                showSuccessToast(data.message);
                location.reload();
            }
        },
        error: function () {
            showErrorToast("Something went wrong. Please try again");
        },
    });
}

function resetParkingLog() {
    $('#sec_empid').val(null);
    $('#sec_empName').val(null);
    $('#sec_vehicleNo').val(null);
    $('#sec_vehicleType').val(0);
    $('#sec_rfidNo').val(null);
}

function validateAddition(items) {
    const locationId = $('#parking_location_ddl_sec').val();
    items.forEach(loc => {
        if (loc.ParkingLocations && loc.ParkingLocations.length > 0) {
            loc.ParkingLocations.forEach($p => {
                if ($p.LocationId == locationId) {
                    if ($p.AvailableTwoWheelerCount == 0 && $p.AvailableFourWheelerCount == 0) {
                        $('#sec_empid').attr('disabled', 'disabled');
                        $('#sec_empName').attr('disabled', 'disabled');
                        $('#sec_vehicleNo').attr('disabled', 'disabled');
                        $('#sec_vehicleType').attr('disabled', 'disabled');
                        $('#sec_rfidNo').attr('disabled', 'disabled');
                        $('#btnSaveParkingLog').attr('disabled', 'disabled');
                        $('#btnCancelParkingLog').attr('disabled', 'disabled');
                    }
                    else if ($p.AvailableTwoWheelerCount == 0 && $p.AvailableFourWheelerCount > 0) {
                        $('#sec_vehicleType').find('option[value=0]').remove();
                    }
                    else if ($p.AvailableTwoWheelerCount > 0 && $p.AvailableFourWheelerCount == 0) {
                        $('#sec_vehicleType').find('option[value=1]').remove();
                    }
                    else {
                        $('#sec_empid').removeAttr('disabled');
                        $('#sec_empName').removeAttr('disabled');
                        $('#sec_vehicleNo').removeAttr('disabled');
                        $('#sec_vehicleType').removeAttr('disabled');
                        $('#sec_rfidNo').removeAttr('disabled');
                        $('#btnSaveParkingLog').removeAttr('disabled');
                        $('#btnCancelParkingLog').removeAttr('disabled');
                        $('#sec_vehicleType').find('option[value=0]').remove();
                        $('#sec_vehicleType').find('option[value=1]').remove();
                        $('#sec_vehicleType').append(new Option('2Wheeler', 0));
                        $('#sec_vehicleType').append(new Option('4Wheeler', 1));
                    }

                }
            });
        }
    });
    return false;
}

function autoPopulateDetails(vehicleStr) {
    const contextVehicleDetails = JSON.parse(vehicleStr);
    const inputKey = $("#sec_vehicleNo").val();
    if (inputKey.trim() == "") {
        $('#sec_empid').val(null);
        $('#sec_empName').val(null);
        $('#sec_vehicleType').val(0);
        return;
    }
    contextVehicleDetails.forEach(vehicle => {
        if (vehicle.vehicleNumber.indexOf(inputKey) > -1) {
            $('#sec_empid').val(vehicle.ownerEmployeeId);
            $('#sec_empName').val(vehicle.ownerName);
            $('#sec_vehicleType').val(vehicle.vehicleType);
        }
    });

}

function submitReservationRequest() {
    let request = {};
    request.locationId = $("#parking_location_ddl_res").val();
    request.empName = $("#res_empName").val();
    request.vehicleType = $("#res_vehicleType").val();
    request.vehicleCount = $("#res_vehicleCount").val();
    request.reservationDate = $("#res_date").val();
    request.officeLocation = $("#location_ddl_res").val();
    request.location = $("#parking_location_ddl_res option:selected").text().trim();
    if (request.empName.trim() == "" || request.empName == null) {
        showErrorToast(`Name is mandatory for reserving a parking`);
        return;
    }
    if (request.reservationDate.trim() == "" || request.reservationDate == null) {
        showErrorToast(`Reservation Date is mandatory for reserving a parking`);
        return;
    }
    $.ajax({
        type: "POST",
        url: `/admin/submitReservation`,
        cache: false,
        data: request,
        dataType: "json",
        beforeSend: function () {
            showLoadingToast("Adding details...");
        },
        success: function (data) {
            if (data && (data.statusCode == 401 || data.statusCode == 402)) {
                showErrorToast(data.message);
            }
            else {
                showSuccessToast(data.message);
                setTimeout(() => {
                    location.reload();
                }, 3000);
            }
        },
        error: function () {
            showErrorToast("Something went wrong. Please try again");
        },
    });
}

function resetReservationForm() {
    $("#res_empName").val(null);
    $("#res_vehicleType").val(0);
    $("#res_vehicleCount").val(null);
    $("#res_date").val(null);
}


function bindReservationData(reservationLogStr) {
    const reservationLog = JSON.parse(reservationLogStr);
    $("#modTxtRequestedDate").val(reservationLog.reservationDate);
    $("#modTxtOffice").val(reservationLog.officeLocation);
    $("#modTxtParkingLoc").val(reservationLog.parkingLocation);
    $("#modTxtCreatedDate").val(reservationLog.createdDate.split("T")[0]);
    $("#modTxtVehicleType").val(reservationLog.vehicleType == 0 ? "2 Wheeler" : "4 Wheeler");
    $("#modTxtVehicleCount").val(reservationLog.vehicleCount);
    $("#modTxtGuestName").val(reservationLog.employeeName);
    $("#modTxtRequestedBy").val(reservationLog.requestedBy);
    $("#lblRequestId").empty();
    $("#lblRequestId").text(reservationLog.uniqueId);
}

function showExportDetails() {
    $('#details_div_date').removeClass("d-none");
}

function submitExport() {
    const excelUrl = `/admin/exportParkingLogs?startDate=${$("#dtStartDate").val()}&endDate=${$("#dtEndDate").val()}`;
    window.open(excelUrl);
}


function addUserFromExcel() {
    let oFile = document.getElementsByName("inputExcel")[0].files[0];
    let sFilename = oFile.name;
    let reader = new FileReader();
    let result = {};
    reader.onload = function (e) {
        let data = e.target.result;
        data = new Uint8Array(data);
        let workbook = XLSX.read(data, { type: 'array' });
        let result = {};
        workbook.SheetNames.forEach(function (sheetName) {
            let roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
            if (roa.length) result[sheetName] = roa;
        });
        if (result) {
            let payLoad = {};
            payLoad.temp = [];
            for (let i = 1; i < result.UserLogs.length; i++) {

                if (result.UserLogs[i].length > 0) {
                    let tempIt = [];
                    result.UserLogs[i].forEach(x => {
                        tempIt.push(x);
                    });
                }
                payLoad.temp.push(tempIt);
            }
            console.log(payLoad);
            $.ajax({
                type: "POST",
                method: "POST",
                url: "/admin/add_excel_users",
                data: { data: payLoad.temp, count: payLoad.temp.length },
                dataType: "json",
                cache: false,
                beforeSend: function () {
                    $(".addItemExcel").prop("disabled", true);
                    $(".addItemExcel").html(
                        '<i class="ace-icon fa fa-spinner fa-spin bigger-125"></i> Please wait...'
                    );
                },
                success: function (data) {
                    //$(".addItemExcel").html("Submit");
                    $(".addItemExcel").prop("disabled", false);
                    if (data.statusCode == 200) {
                        showSuccessToast(data.message);
                        setTimeout(function () {
                            window.location.reload();
                        }, 1000);
                    } else {
                        showErrorToast(data.message);
                    }
                },
                error: function () {
                    //$(".addItemExcel").html("Submit");
                    $(".addItemExcel").prop("disabled", false);
                    showErrorToast("Something went wrong. Please try again");
                },
            });

        }
    };
    reader.readAsArrayBuffer(oFile);
}

function exportUserDetails() {
    const excelUrl = `/admin/export_user_details`;
    window.open(excelUrl);
}

function cancelReservation(requestId) {
    $.ajax({
        type: "POST",
        url: `/admin/cancel_reservation`,
        cache: false,
        data: { "id": requestId },
        dataType: "json",
        beforeSend: function () {
            showLoadingToast("In Progress...");
        },
        success: function (data) {
            if (data.statusCode == 2022) {
                showErrorToast(data.message);
            }
            else {
                showSuccessToast(data.message);
                setTimeout(() => {
                    location.reload();
                }, 3000);
            }
        },
        error: function () {
            showErrorToast("Something went wrong. Please try again");
        },
    });
}

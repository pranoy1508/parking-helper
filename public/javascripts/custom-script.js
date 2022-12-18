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
    dateFormat: "dd/mm/yy",
    changeYear: true,
    maxDate: 0,
    yearRange: '-100:+0'
});

$('.endDatePicker').datepicker({
    dateFormat: "dd/mm/yy",
    changeYear: true
});

function locationSelectionChanged(item) {
    $('#details_div').addClass("d-none");
    if (item.value == "-- Please Select --") {
        $('#parking_location_ddl').empty();
    } else {
        $.ajax({
            type: "POST",
            url: `http://localhost:3033/admin/get_parking_locations`,
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
    var locationId = $('#parking_location_ddl').val();
    $.ajax({
        type: "POST",
        url: `http://localhost:3033/admin/get_location_details`,
        cache: false,
        data: { "locationId": locationId },
        dataType: "json",
        beforeSend: function () {
            showLoadingToast("Getting parking details...");
        },
        success: function (data) {
            showSuccessToast("Success");
            $('#lblLocation').text($("#parking_location_ddl").text());
            $('#details_div').removeClass("d-none");
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
        url: `http://localhost:3033/admin/update_location_details`,
        cache: false,
        data: { "locationId": locationId, "twoWheelerCount": twoWheelerCount, "fourWheelerCount": fourWheelerCount},
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
        $('[name="txtTwoWheelerCount"]').attr("readonly",true);
    }
    else if (wheelerCount == 4) {
        $('[name="btnSaveFour"]').addClass("d-none");
        $('[name="btnCancelFour"]').addClass("d-none");
        $('[name="btnEditFour"]').removeClass("d-none");
        $('[name="txtFourWheelerCount"]').attr("readonly",true);
    }
    getParkingDetails();

}
$(document).ready(function () {
    setInterval(() => {
        refreshAvailabilityView()
    }, 5000);
});

function refreshAvailabilityView() {
    $.ajax({
        type: "GET",
        url: `/parking/getAvailability`,
        cache: false,
        beforeSend: function () {
            //showLoadingToast("Adding details...");
        },
        success: function (data) {
            $("#parking_full_details").html(data);
        },
        error: function () {
            //showErrorToast("Something went wrong. Please try again");
        },
    });
}

function getReservationDetailsForGuest() {
    const inputGuestName = $("#txt_guestName").val();
    const tableData = $("#tbl_check_in");
    const trData = tableData[0].getElementsByTagName("tr");
    for (let idx = 1; idx < trData.length; idx++) {
        const tdGuestData = trData[idx].getElementsByTagName("td")[1];
        if (tdGuestData) {
            const guestName = tdGuestData.innerText.trim();
            if (guestName.toUpperCase().indexOf(inputGuestName.toUpperCase()) > -1) {
                trData[idx].style.display = "";
            } else {
                trData[idx].style.display = "none";
            }
        }
    }
}

function checkInGuest(reservationId) {
    $.ajax({
        type: "POST",
        url: `/parking/check_in_guest`,
        cache: false,
        data: { "reservationId": reservationId },
        dataType: "json",
        beforeSend: function () {
            //showLoadingToast("Registering...");
        },
        success: function (data) {
            if (data.statusCode == 2021) {
                showErrorToast(data.message);
            }
            else {
                showSuccessToast(data.message);
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        },
        error: function () {
            showErrorToast("Something went wrong. Please try again");
        },
    });
}

function getCheckOutDetails() {
    const inputVehicleNumber = $("#txt_vehicleName_srch").val();
    $.ajax({
        type: "GET",
        url: `/parking/getCheckOutDetailsByVehicleNumber?v_no=${inputVehicleNumber.trim()}`,
        cache: false,
        beforeSend: function () {
            //showLoadingToast("Adding details...");
        },
        success: function (data) {
            $("#tbl_check_out_support").html(data);
        },
        error: function () {
            //showErrorToast("Something went wrong. Please try again");
        },
    });
}
$(document).ready(function () {
    setInterval(()=>{
        refreshAvailabilityView()
    },5000);
});

function refreshAvailabilityView()
{
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
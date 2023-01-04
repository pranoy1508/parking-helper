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

function getReservationDetailsForGuest()
{
    const inputGuestName= $("#txt_guestName").val();
    const tableData = $("#tbl_check_in");
    const trData = tableData[0].getElementsByTagName("tr");
    for(let idx=1;idx<trData.length;idx++)
    {
        const tdGuestData = trData[idx].getElementsByTagName("td")[1];
        if (tdGuestData)
        {
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
    alert(reservationId);
}
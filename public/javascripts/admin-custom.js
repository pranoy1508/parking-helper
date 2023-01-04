function searchById() {
    const requestId = $("#txtSearchReq").val();
    if (requestId.trim() == "") {
        location.reload();
    }
    else {
        $.ajax({
            type: "GET",
            url: `/admin/search?id=${requestId}`,
            cache: false,
            beforeSend: function () {
                //showLoadingToast("Adding details...");
            },
            success: function (data) {
                $("#tbl_reservations").html(data);
            },
            error: function () {
                //showErrorToast("Something went wrong. Please try again");
            },
        });
    }
}

function clearView() {
    const requestId = $("#txtSearchReq").val();
    if (requestId.trim() == "") {
        location.reload();
    }
}
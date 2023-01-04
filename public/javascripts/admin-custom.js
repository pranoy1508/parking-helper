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

function clearView(control) {
    if (control.value.trim() == "") {
        location.reload();
    }
}

function searchUserByEmail() {
    const userName = $("#txtSearchReqUser").val();
    if (userName.trim() == "") {
        userName.reload();
    }
    else {
        $.ajax({
            type: "GET",
            url: `/admin/search_user?user=${userName}`,
            cache: false,
            beforeSend: function () {
                //showLoadingToast("Adding details...");
            },
            success: function (data) {
                $("#user_tbl").html(data);
            },
            error: function () {
                //showErrorToast("Something went wrong. Please try again");
            },
        });
    }
}

function exportImportHistory(historyId) {
    const excelUrl = `/admin/exportImportHistory?id=${historyId}`;
    window.open(excelUrl);
}

function searchHistory() {
    const requestId = $("#txtSearchImportId").val();
    if (requestId.trim() == "") {
        location.reload();
    }
    else {
        $.ajax({
            type: "GET",
            url: `/admin/searchHistory?id=${requestId}`,
            cache: false,
            beforeSend: function () {
                //showLoadingToast("Adding details...");
            },
            success: function (data) {
                $("#tbl_import_history").html(data);
            },
            error: function () {
                //showErrorToast("Something went wrong. Please try again");
            },
        });
    }
}
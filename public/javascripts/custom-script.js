function showSuccessToast(msg) {
    $.toast().reset('all');
    $.toast({
        text: msg,
        allowToastClose: true,
        hideAfter: 3000,
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
        hideAfter: 30000000,
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
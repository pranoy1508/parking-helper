
/**** Login STARTS ****/
if ($('#sign_in_form').length > 0) {

  $('#sign_in_form').submit(function (e) {
    e.preventDefault();
  }).validate({
    rules: {
      login_id: {
        required: true
      },
      password: {
        required: true,
      },
    },
    messages: {
      login_id: "Please enter email id / username id",
      password: "Please enter password",
    },
    submitHandler: function (form) {
      let formData = $('#sign_in_form').serializeArray();
      $.ajax({
        type: "POST",
        url: "/login_post",
        data: formData,
        dataType: 'json',
        cache: false,
        beforeSend: function () {
          $('.signInButton').html('<i class="ace-icon fa fa-spinner fa-spin bigger-125"></i> Please wait...');
        },
        success: function (data) {
          $('.signInButton').html('Login');
          if (data.status == 1) {
            showSuccessToast(data.message);
            setTimeout(function () {
              window.location.href = "onLoad";
            }, 1000);
          } else {
            showErrorToast(data.message);
          }
        },
        error: function () {
          $('.signInButton').html('Login');
          showErrorToast("Something went wrong. Please try again");
        }
      });
    }
  });
}
/**** Login END ****/

if ($("#change_password").length > 0) {
  $("#change_password")
    .submit(function (e) {
      e.preventDefault();
    })
    .validate({
      rules: {
      },
      messages: {
      },
      submitHandler: function (form) {
        let formData = $("#change_password").serializeArray();
        $.ajax({
          type: "POST",
          url: "/change_password",
          data: formData,
          dataType: "json",
          cache: false,
          beforeSend: function () {
            $(".changePassword").prop("disabled", true);
            $(".changePassword").html(
              '<i class="ace-icon fa fa-spinner fa-spin bigger-125"></i> Please wait...'
            );
          },
          success: function (data) {
            $(".changePassword").html("Submit");
            $(".changePassword").prop("disabled", false);
            if (data.status == 1) {
              showSuccessToast(data.message);
              setTimeout(function () {
                window.location.reload();
              }, 1000);
            } else {
              showErrorToast(data.message);
            }
          },
          error: function () {
            $(".changePassword").html("Submit");
            $(".changePassword").prop("disabled", false);
            showErrorToast("Something went wrong. Please try again");
          },
        });
      },
    });
}
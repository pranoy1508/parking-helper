var nodemailer = require('nodemailer');
const emailTemplates = require("../templates/approvalEmailTemplate.json");


module.exports.TriggerEmail = async (toList, emailSubject, emailBody) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.WHIZ_EMAIL,
            pass: process.env.EMAIL_PWD
        }
    });
    const mailOptions = {
        from: process.env.WHIZ_EMAIL,
        to: toList,
        subject: emailSubject,
        html: emailBody
    };
    try {
        await transporter.sendMail(mailOptions);
    }
    catch (exception) {
        console.log(exception);
    }

}

module.exports.GetEmailBodyTemplate = async (emailType) => {
    return emailTemplates.find(x => x.emailType == emailType).template;
}





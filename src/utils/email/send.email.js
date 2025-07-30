import nodemailer from 'nodemailer';

export async function sendEmail({ from = "", to = "",
    cc="",
        bcc="",
    subject = "",
    text = "",
    html = "",
attachments=[]} = {}) {
    
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.APP_EMAIL,
            pass: process.env.APP_PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: `"=>📮✉ " <${from}>`,
        to,
        cc,
        bcc,
        subject,
        text,
        html,
        attachments,
    });

    console.log("Message sent:", info.messageId);

};

//  export const sendEmail = asyncHandler(async (req, res, next) => {
//     const { sender, receiver, senderPass, subject, content } = req.body;

//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: sender,
//             pass: senderPass
//         }
//     });
    
//     let mailOptions = {
//         from: sender,
//         to: receiver,
//         subject: subject,
//         text: content
//     };
    
//     transporter.sendMail(mailOptions, function (error, info) {
//         if (error) {
//             return next(new Error("In-Valid mail Options", { cause: 400 }));
//         } else {
//             return successResponse({
//                 res,
//                 message: 'Email sent Successfully ✅',
//                 data: info.response
//             })
//         }
//     });
// });


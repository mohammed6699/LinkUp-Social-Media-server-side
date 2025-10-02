import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
// send email when connection send
// get the required data by using Brevo
// create a transporter object using SMTP settings
// to provide SMTP host, user, pass and also emial Id we will user Brevo
dotenv.config();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
const sendEmail = async ({to, subject, body}) => {
    const response = await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to,
        subject,
        html: body,
    })
    return response
}
export default sendEmail;
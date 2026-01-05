import nodemailer from "nodemailer";

export const sendUserMail = async (
    email,
    userName,
    mobileNo,
    password,
    RerenceceID
) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com", // ✅ CORRECT
            port: 587,                   // ✅ REQUIRED
            secure: false,               // ✅ TLS
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        // Optional but recommended (debug)
        await transporter.verify();
        console.log("SMTP connection verified");

        const mailOptions = {
            from: `"ARRA Admin" <${process.env.MAIL_USER}>`,
            to: email,
            subject: "Your ARRA Account Login Credentials",
            html: `
                <div style="font-family:Arial, sans-serif; line-height:1.6">
                    <h2>Welcome to ARRA</h2>
                    <p>Your account has been successfully created.</p>

                    <table style="border-collapse:collapse">
                        <tr>
                            <td><b>Reference ID</b></td>
                            <td>: ${RerenceceID}</td>
                        </tr>
                        <tr>
                            <td><b>User Name</b></td>
                            <td>: ${userName}</td>
                        </tr>
                        <tr>
                            <td><b>Mobile Number</b></td>
                            <td>: ${mobileNo}</td>
                        </tr>
                        <tr>
                            <td><b>Password</b></td>
                            <td>: ${password}</td>
                        </tr>
                    </table>

                    <p style="color:red">
                        ⚠️ Please change your password immediately after first login.
                    </p>

                    <p>Regards,<br/>ARRA Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ User credential email sent successfully");

    } catch (error) {
        console.error("❌ Email sending failed:", error);
        throw error;
    }
};

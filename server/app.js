const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const mysql = require("mysql2/promise");
const formidable = require("formidable");
const Paytm = require("paytmchecksum");
const https = require("https");
const middleware = require("./middleware");
const { checkEvent, registerSoloEvent, createTeam, joinTeam, getTeamInfo, getEvents } = require("./db/events");
const { createProfile, updateProfile } = require("./db/profileUtil");
const { checkBuyPass, buyPass, getTxnDetails } = require("./db/buyPass");
const { makePayment } = require("./payment");
const { sendResetPassEmail, assumePassCode, getParticipantID } = require("./util");

const app = express();
const port = process.env.PORT || 3000;
let conn;

(async function initDB() {
	conn = await mysql.createConnection(process.env.DATABASE_URL);
})();

app.use(cors({ accessControlAllowOrigin: "*" }));
app.use(express.json());
app.use(middleware.decodeToken);

let otps = {};

let paymentStatus = {};

let orderIDEmail = {};

let transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.NODEMAILER_EMAIL,
		pass: process.env.NODEMAILER_EMAIL_PASS,
	},
});
// console.log("Ashish", path.resolve("./Templates"));
const handlebarOptions = {
	viewEngine: {
		extName: ".handlebars",
		partialsDir: path.resolve("./Templates"),
		defaultLayout: false,
	},
	viewPath: path.resolve("./Templates"),
	extName: ".handlebars",
};

transporter.use("compile", hbs(handlebarOptions));

// OTP Logic
app.post("/api/generateOTP", async (req, res) => {
	const email = req.body.email;
	console.log(email);
	const [rows, f] = await conn.execute(
		`SELECT * FROM Participants WHERE Email = '${email}';`
	);

	// console.log( path.dirname() );
	if (rows.length > 0)
		return res.status(400).json({
			isOTPGenerated: false,
			message: "User already exist",
			type: "error",
		});

	const otp = ("" + Math.random()).substring(2, 8);

	otps[email] = otp;
	// delete otp after 10 minutes
	setTimeout(() => {
		if (otps[email]) delete otps[email];
	}, 10 * 60 * 1000);
	// console.log(LoginOTPHTML(otp))
	transporter.sendMail(
		{
			from: `"Ananta" <${process.env.NODEMAILER_EMAIL}>`,
			to: email,
			subject: "OTP for login",
			template: "LoginOTP",
			context: {
				otp: otp,
			},
		},
		(error, info) => {
			if (error) {
				delete otps[email];
				return res.status(500).json({
					isOTPGenerated: false,
					message: "Something went Wrong",
					type: "error",
				});
			} else {
				return res.status(200).json({
					isOTPGenerated: true,
					message: "OTP Sent!",
					type: "success",
				});
			}
		}
	);
});

app.post("/api/verifyOTP", (req, res) => {
	const email = req.body.email;
	const otp = req.body.otp;

	const isVerified = otps[email] === otp;
	if (isVerified) delete otps[email];

	return res.json({
		isOTPVerified: isVerified,
		type: isVerified ? "success" : "error",
	});
});

// Profile Logic

app.post("/api/create-profile", async (req, res) => {
	const bd = req.body;

	console.log(bd);
	const response = await createProfile(
		conn,
		bd.email,
		bd.googleAuth,
		bd.photoURL
	);

	console.log(response);

	return res.status(response.code).json(response.resMessage);
});

app.post("/api/secure/update-profile", async (req, res) => {
	const body = req.body;
	const email = req.user.email;

	const response = await updateProfile(conn, email, body);

	return res.status(response.code).json(response.resMessage);
});

app.get("/api/secure/get-profile", async (req, res) => {
	const email = req.user.email;

	const [rows, f] = await conn.execute(
		`SELECT ParticipantID, ProfileStatus, Firstname, Lastname, Gender, DOB, City, State, ContactNo, University, Branch, StudyYear, Email, DigitalPoints, TxnStatus, PassCode FROM Participants WHERE Email = '${email}';`
	);

	if (rows.length === 0) {
		// console.log(rows);
		return res.status(404).json({ message: {}, type: "error" });
	} else {
		// console.log(rows[0]);
		return res.status(200).json({ message: rows[0], type: "success" });
	}
});




// Buy Pass Logic

app.post("/api/secure/pass/buy", async (req, res) => {
	const { PID, passCode, amt } = req.body;

	// participantID = await getParticipantID(email);
	console.log(req.body);
	const response = await buyPass(conn, PID, passCode, amt);

	return res.status(response.code).json(response.resMessage);
	// res.json({ParticipantID : ParticipantID,SelectedEvent : EventCode})
});


app.post("/api/secure/getEvents", async (req, res) => {
	const { email_ } = req.body;

	// participantID = await getParticipantID(email);
	console.log(req.body);
	const participantID = await getParticipantID(conn, email_);

	console.log(participantID);
	const response = await getEvents(conn, participantID);

	return res.status(response.code).json(response.resMessage);
	// res.json({ParticipantID : ParticipantID,SelectedEvent : EventCode})
});


// Forgot Password : Send OTP
app.post("/api/forgotpassword/checkuser", async (req, res) => {
	email = req.body.email;

	const check = await sendResetPassEmail(conn, email);

	console.log(check);

	if (check.resMessage.type === "success") {
		console.log("success send the reset password OTP...");
	} else if (check.resMessage.type === "error") {
		console.log(check.resMessage);
	}

	return res.status(check.code).json(check.resMessage);
});

app.post("/api/secure/pass/buy/check", async (req, res) => {
	const { passCode, PID } = req.body;

	const response = await checkBuyPass(conn, passCode, PID);

	console.log(response);
	return res.status(response.code).json(response.resMessage);
	// res.json({ParticipantID : ParticipantID,SelectedEvent : EventCode})
});

// Payment Logic

app.post("/api/get-payment-info", async (req, res) => {
	const response = await makePayment(req);

	if (response.code == 200) {
		// console.log(response.resMessage.EMAIL, response.resMessage.ORDER_ID);
		orderIDEmail[response.resMessage.ORDER_ID] = response.resMessage.EMAIL;
		console.log(orderIDEmail[response.resMessage.ORDER_ID])

		setTimeout(() => {
			if (orderIDEmail[response.resMessage.ORDER_ID]) delete orderIDEmail[response.resMessage.ORDER_ID];
		}, 30 * 60 * 1000);

	}

	return res.status(response.code).json(response.resMessage);
});

app.post("/api/payment-callback", async (req, res) => {
	const form = new formidable.IncomingForm();


	let resFields = new Promise((resolve, reject) => {
		form.parse(req, async (err, fields, files) => {
			if (err) {
				console.log(err);
				res.status(500).json({
					message: "Something went wrong",
					type: "error",
				});
			}
			resolve(fields);
		});
	});

	resFields.then(async (resFields) => {
		console.log(resFields);

		let paytmParams = {};

		paytmParams.body = {
			mid: resFields.MID,
			orderId: resFields.ORDERID,
		};

		const paytmChecksum = await Paytm.generateSignature(
			JSON.stringify(paytmParams.body),
			process.env.PAYTM_MERCHANT_KEY
		);

		if (paytmChecksum) {
			paytmParams.head = {
				signature: paytmChecksum,
			};

			let post_data = JSON.stringify(paytmParams);

			let options = {
				/* for Staging */
				hostname: "securegw.paytm.in",
				/* for Production */
				// hostname: 'securegw.paytm.in',
				port: 443,
				path: "/v3/order/status",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": post_data.length,
				},
			};

			// Set up the request
			let response = "";
			let post_req = https.request(options, async function (post_res) {
				post_res.on("data", function (chunk) {
					response += chunk;
				});

				post_res.on("end", async function () {
					const data = JSON.parse(response);
					console.log(data);

					paymentStatus[orderIDEmail[data.body.orderId]] = data.body.resultInfo.resultStatus;

					
					const passCode = await assumePassCode(conn, orderIDEmail[data.body.orderId], data.body.txnAmount);
					
					console.log("Email:", orderIDEmail[data.body.orderId])
					console.log("OrderID:", data.body.orderId);
					console.log("Amount:", data.body.txnAmount);
					console.log("PassCode:", passCode);
					

					if (data.body.resultInfo.resultStatus === "TXN_SUCCESS") {

						const participantID = await getParticipantID(conn, orderIDEmail[data.body.orderId])
						console.log("Order:Email =>" , orderIDEmail)
						const updateDatabase = await buyPass(conn, participantID, passCode, data.body);
						console.log(updateDatabase);
						if (updateDatabase) {
							res.redirect(`${process.env.REACT_URL}/paymentsuccess`);
						} else {
							res.redirect(`${process.env.REACT_URL}/paymentfail`);
						}
					} else {
						// res.redirect(`${process.env.CLIENT_URL}/paymentfailure/${data.body.orderId}`)
						res.redirect(`${process.env.REACT_URL}/paymentfail`);
					}
				});
			});

			// post the data
			post_req.write(post_data);
			post_req.end();
		}
	});

	// return res.status(200).json({ message: "Payment Callback", type: "success" })
	// res.redirect(`${process.env.CLIENT_URL}/buypass`)
});

app.post("/api/payment/checkPaymentStatus", async (req, res) => {
	const {email} = req.body;
	// console.log(paymentStatus[email]);

	const txnDetails = await getTxnDetails(conn, email)
	console.log(txnDetails)
	return res.json(txnDetails);
});



   
app.post("/api/secure/event/check", async (req, res) => {
    console.log(req.body);
    const { eventCode, email } = req.body;

    // console.log(eventCode, email)

    const participantID = await getParticipantID(conn, email);
    // console.log(participantID)
    const response = await checkEvent(conn, eventCode, participantID);
    console.log(response);

    return res.status(response.code).json(response);
});

app.post("/api/secure/events/solo/register", async (req, res) => {
    console.log(req.body);
    const { selectedEventCode, email } = req.body;

    const participantID = await getParticipantID(conn, email);

    const response = await registerSoloEvent(
        conn,
        selectedEventCode,
        participantID
    );
    console.log(response);

    return res.status(response.code).json(response);
});

app.post("/api/secure/events/team/create", async (req, res) => {
    console.log(req.body);
    const { selectedEventCode, email, teamName, selectedEventName } = req.body;

    const participantID = await getParticipantID(conn, email);

    const response = await createTeam(
        conn,
        selectedEventCode,
        participantID,
        teamName
    );
    console.log(response);

    if (response.type == "success") {
		console.log('success');
        await transporter
            .sendMail({
                from: `"Ananta" <${process.env.NODEMAILER_EMAIL}>`,
                to: email,
                subject: "Team",
				template: "CreateTeam",
                context: {
					teamName: teamName,
					teamID: response.teamID,
					eventName: selectedEventName
				},
            })
            .then((info) => {
                console.log(info);
                if (info) {
                    response.mailStatus = "success";
                } else {
                    response.mailStatus = "error";
                }
            })
            .catch((err) => {
				console.log(err);
                response.mailStatus = err;
            });
    }

    return res.status(response.code).json(response);
});

app.post("/api/secure/events/team/join", async (req, res) => {
    console.log(req.body);
    const { selectedEventCode, email, teamID } = req.body;

    const participantID = await getParticipantID(conn, email);

    const response = await joinTeam(
        conn,
        selectedEventCode,
        participantID,
        teamID
    );
    console.log(response);

    return res.status(response.code).json(response);
});

app.post("/api/secure/events/team/getinfo", async (req, res) => {
    console.log(req.body);
    const { teamID } = req.body;

    const response = await getTeamInfo(conn, teamID);

    return res.status(response.code).json(response.resMessage);
});






app.listen(port, () => {
	console.log(`Server listening on PORT : ${port}`);
});

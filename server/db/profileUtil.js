const { genParticipantID } = require('../util');

async function createProfile(conn, email, googleAuth, profileImg) {

    //check if participant already exist with given email id
    const [checkRows, checkFields] = await conn.execute(`SELECT * FROM Participants WHERE Email = '${email}';`)

    if (checkRows.length > 0) {
        //!TODO handle if user's log in method is email&pass
        if (checkRows[0].GoogleAuth === 0 && googleAuth === 'TRUE') {
            // update info if user is migrating account to google
            const [updateRows, updateFields] = await conn.execute(`UPDATE Participants SET GoogleAuth=${googleAuth}, ProfileImg='${profileImg}' WHERE Email = '${email}';`)
            return { code: 200, resMessage: { message: "Profile Updated", type: "success" } };
        } else {
            return { code: 200, resMessage: { message: "Login with google", type: "success" } };
        }
    } else {

        let id = genParticipantID(email);
        let idDoesExist = false;
        do {
            const [checkIdRows, checkIdFields] = await conn.execute(`SELECT * FROM Participants WHERE ParticipantID='${id}';`)
            if (checkIdRows.length > 0) {
                idDoesExist = true;
                id = genParticipantID(email);
            } else {
                idDoesExist = false;
            }
        } while (idDoesExist);

        // create new participant
        let query = `INSERT INTO Participants (ProfileStatus, PaymentStatus, ParticipantID, Email, ProfileImg, GoogleAuth) VALUES (FALSE, FALSE, '${id}', '${email}', '${profileImg}', ${googleAuth});`;

        const [profileRows, profileFields] = await conn.execute(query)

        if (profileRows) {
            return { code: 200, resMessage: { message: "Profile created successfully", type: "success" } };
        } else {
            return { code: 500, resMessage: { message: "Internal Server Error", type: "error" } };
        }
    }
}

async function updateProfile(conn, email, body) {
    const { fName, lName, contactNo, uniName, branch, year, dob, gender, city, state } = body;

    const [rows, fields] = await conn.execute(`UPDATE Participants SET ProfileStatus=TRUE, Firstname='${fName}', Lastname='${lName}', ContactNo='${contactNo}', University='${uniName}', Branch='${branch}', StudyYear='${year}', DOB='${dob}', Gender='${gender}', City='${city}', State='${state}' WHERE Email = '${email}';`)

    if (rows) {
        return { code: 200, resMessage: { message: "Profile Updated", type: "success" } };
    } else {
        return { code: 500, resMessage: { message: "Internal Server Error", type: "error" } };
    }
}

module.exports = {
    createProfile,
    updateProfile
}
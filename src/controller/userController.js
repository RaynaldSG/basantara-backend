const jwt = require('jsonwebtoken');

const firestoreDatabase = require("../utils/firestoreConnect");
const { hashPassword, comparePassword } = require("../utils/hashHelper");

const jwtKey = process.env.JWT_SECRET_KEY;
const userFirestore = firestoreDatabase.collection('users');

async function userRegister(req, res) {
    try {
        const { email, password, username } = req.body;

        const checkEmail = await userFirestore.where('email', '==', email).get();

        if (!checkEmail.empty) {
            const error = new Error("Email Already Registered");
            error.statusCode = 400
            throw error;
        }

        const hashedPassword = await hashPassword(password);
        userFirestore.add({
            email: email,
            password: hashedPassword,
            username: username,
        });

        res.status(200);
        res.json({
            status: "Success",
            message: "Register Success",
        });
    } catch (error) {
        res.status(error.statusCode || 500);
        res.json({
            status: "Error",
            message: error.message,
        });
        console.log(error);
    }
}

async function userLogin(req, res) {
    try {
        const { email, password } = req.body;
    
        const userDataQuery = (await userFirestore.where('email', '==', email).get());
        const userData = userDataQuery.docs[0];
    
        if (userData.empty) {
            const error = new Error("Login Failed");
            error.statusCode = 400
            throw error;
        }

        const checkPassword = await comparePassword(password, userData.data().password);
        if(!checkPassword){
            const error = new Error("Login Failed");
            error.statusCode = 400
            throw error;
        }

        const token = jwt.sign({id: userData.id}, jwtKey, { expiresIn: '15s' });
        res.status(200);
        res.json({
            status: "Success",
            message: "Login Success",
            token,
        });

    } catch (error) {
        res.status(error.statusCode || 500);
        res.json({
            status: "Error",
            message: error.message,
        });
        console.log(error);
    }
}

module.exports = { userRegister, userLogin }
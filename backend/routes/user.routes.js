const express = require("express");
const {body} = require("express-validator");
const userController = require("../controllers/user.controller.js");
const router = express.Router();

router.post("/register",[
	body('email').isEmail().withMessage('Invalid Email'),
	body('fullname.firstname').isLength({ min: 3}).withMessage("First name must be at least 3 characters or longer"),
	body('password').isLength({ min: 6}).withMessage("Password must be at least 6 characters or longer")
], userController.registerUser);

router.post("/login", [
	body('email').isEmail().withMessage('Invalid Email'),
	body('password').isLength({ min: 6}).withMessage('Password must be at least 6 characters or longer')
], userController.loginUser)

module.exports = router;
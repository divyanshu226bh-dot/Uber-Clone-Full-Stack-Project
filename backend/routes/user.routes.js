const express = require("express");
const {body} = require("express-validator");
const userController = require("../controllers/user.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const router = express.Router();


/*
* POST /users/register
*/
router.post("/register",[
	body('email').isEmail().withMessage('Invalid Email'),
	body('fullname.firstname').isLength({ min: 3}).withMessage("First name must be at least 3 characters or longer"),
	body('password').isLength({ min: 6}).withMessage("Password must be at least 6 characters or longer")
], userController.registerUser);


/*
* POST /users/login
*/
router.post("/login", [
	body('email').isEmail().withMessage('Invalid Email'),
	body('password').isLength({ min: 6}).withMessage('Password must be at least 6 characters or longer')
], userController.loginUser)


/*
* GET /users/profile
*/
router.get("/profile", authMiddleware.authUser, userController.getUserProfile);

/*
* GET /users/logout
*/
router.get('/logout', authMiddleware.authUser, userController.logoutUser);


module.exports = router;
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
	fullname: {
		firstname: {
			type: String,
			required: [true, "First name is required"],
			minlength: [3 , "First name must be at least 3 characters or longer"]
		},

		lastname: {
			type: String,
			minlength: [3 , "Last name must be at least 3 characters or longer"]
		},
	},

	email:{
		type: String,
		required: [true, "Email is required"],
		unique: [true, "Email is already used"],
		minlength: [3 , "Email must be at least 5 characters or longer"]
	},

	password:{
		type: String,
		required: [true , "Password is required"],
		select: false
	}, 

	socketId:{
		type: String,
	}
});

userSchema.methods.generateAuthToken = function(){
	const token = jwt.sign({_id: this._id}, process.env.JWT_SECRET);
	return token;
}

userSchema.methods.comparePassword = async function(password){
	return await bcrypt.compare(password, this.password)
};

userSchema.statics.hashPassword = async function(password){
	return await bcrypt.hash(password, 10);
}

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;

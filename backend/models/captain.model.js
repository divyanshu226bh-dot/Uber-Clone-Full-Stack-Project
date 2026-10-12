const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const captainSchema = new mongoose.Schema({
	fullname:{
		firstname:{
			type: String,
			required: [true, "Firstname is required"],
			minlength: [3, "First name must be at least 3 characters long"]
		},
		lastname:{
			type: String,
			minlength: [3, "Last name must be at least 3 characters long"]
		},
	},

	email:{
		type: String,
		required: [true, "Email is required"],
		unique: [true, "This email is already used"],
		lowercase: true,
		match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
	},

	password: {
		type: String,
		required: [true, "Password is required field"],
		select: false
	},

	socketId: {
		type: String
	},

	status:{
		type: String,
		enum: ['active', 'inactive'],
		default: 'inactive',
	},

	vehicle:{
		color: {
			type: String,
			required: [true, "Vehicle color is required"],
			minlength: [3, 'Vehicle color must be at least 3 characters long'],
		},
		plate:{
			type: String,
			required: [true, "Vechile plate number is required"],
			minlength: [3, 'Plate must be at least 3 characters long']
		},
		capacity:{
			type: Number,
			required: [true, "Capacity is required"],
			min: [1, "Capacity must be at least 1"]
		},
		vehicleType:{
			type: String,
			required: [true, "Vechicle Type is required"],
			enum: ['car', 'motorcycle', 'auto']
		}
	},

	location:{
		lat: {
			type: Number
		},
		lng:{
			type: Number
		}
	}
});

captainSchema.methods.generateAuthToken = function (){
	const token = jwt.sign({_id: this._id}, process.env.JWT_SECRET, {expiresIn: '24h'});
	return token;
};

captainSchema.methods.comparePassword = async function(password){
	return await bcrypt.compare(password, this.password)
};

captainSchema.statics.hashPassword = async function(password){
	return await bcrypt.hash(password, 10);
}


const captainModel = mongoose.model("captains", captainSchema);

module.exports = captainModel;
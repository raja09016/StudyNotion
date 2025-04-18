const cloudinary = require("cloudinary").v2; //! Cloudinary is being required
require("dotenv").config();

exports.cloudinaryConnect = () => {
	try {
		cloudinary.config({
			
			cloud_name: process.env.CLOUD_NAME,
			api_key: process.env.API_KEY,
			api_secret: process.env.API_SECRET,
		});
		console.log("cloudinary connecetd");
	} catch (error) {
		console.log(error);
	}
};
const User = require("../models/User");
const OTP = require("../models/Otp");
const otpGenerator = require("otp-generator");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const mailSender = require("../utils/mailSender")
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
// befor signup send otp

exports.sendOTP = async (req, res) => {
  try {
    // fech the data
    const { email } = req.body;

    // check if user already exist
    const checkUserPresent = await User.findOne({email});
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already registered",
      });
    }

    // generate otp
    var otp = otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
    })
    // console.log("otp generated successfully" ,otp);

    // make sure unique otp -- check in otp collection
    const result = await OTP.findOne({otp:otp});

    while(result){
        otp = otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        })
        result = await OTP.findOne({otp:otp});
    }

    // enrty of otp in data base  aur ha otp save hone se pehle hi send ho jayega b/c of pre method in otp model
    const otpPayLoad ={
        email,otp
    } 

    const otpBody = await OTP.create(otpPayLoad);
    // console.log(otpBody);

    res.status(200).json({
        success:true,
        message:"Otp sent Successfully",
        otp
    })

  } 
  catch (error) {
    console.log(error);
    return res.ststus(500).json({
        success:false,
        message:error.message

    })
  }
};


//signup

exports.signUp = async (req,res)=>{
    try{
        // data fetching
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;
        // validatation
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp ){
            return res.status(403).json({
                success:false,
                message:"ALL fields are required !"
            })
        }
        // check the password
        if(password != confirmPassword){
            return res.status(400).json({
                success:false,
                message:"password and ConfirmPassword doesn't match  "
            })
        }
        //check user already  exist
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User is already registered !"
            })
        }
        // find the most recent otp saved for the user

        const recentOtp = await OTP.find({email}).sort({ createdAt: -1 }).limit(1);;
        // console.log("recentOtp-",recentOtp,);
        // console.log("length",recentOtp.length)
        // validate otp
        if(recentOtp.length === 0){
            // otp not found 
            return res.status(400).json({
                success:false,
                message:"OTP not found !"
            })
        }
        else if(otp !== recentOtp[0].otp){
            // invalid otp 
            return res.status(400).json({
                success:false,
                message:"INVALID OTP !"
            }) ;
        }
        // hash password
        // console.log("aaaya1")
        const hashedPassword = await bcrypt.hash(password,10);
        // console.log("aaaya2")
        // create entry
        let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);

        const profileDetails = await Profile.create({
            gender : null,
            dateOfBirth:null,
            about:null,
            contactNumber:null
        });

        const user = await User.create({
            firstName,
			lastName,
			email,
			contactNumber,
			password: hashedPassword,
			accountType: accountType,
			approved: approved,
			additionalDetails: profileDetails._id,
			image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
	


        })
        // return res
        res.status(200).json({
            success:true,
            message:"USER is registered successfully",
            user,
        })


    }
    catch(error){
        console.log("error while creating accoung",error);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered , Please try again later",
        })
    }
}



//login

exports.login = async(req,res)=>{
    try{
        // fetch
        const {email ,password } = req.body;
        console.log("aya");
        // validation
        if(!email || !password ){
            return res.status(403).json({
                success : false,
                message:"All fields are required , please try again",
            })
        }
        // check user exist
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success : false,
                message:"User is not registered  , Please signup",
            })

        }
        console.log("aya12-",user);
        // generate jwt , after password match
        if( await  bcrypt.compare(password,user.password)){
            console.log("pass")
            const payload = {
                email:user.email,
                id:user._id,
                accountType:user.accountType,
            }
            const token = jwt.sign(payload , process.env.JWT_SECRET,{
                expiresIn:"2h",
            })
            user.token = token ;
            user.password=undefined;
            console.log("token-",token)
            
            // create cookie and send response
            const options = {
                expires:new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            }
            console.log("final")
            res.cookie("token",token,options).status(200).json({
                success:true,
                token,
                user,
                message:"Logged in Successfully"
            })
            console.log("logged in")
        }

        else{
            // password doesn't match
            return res.status(401).json({
                success : false,
                message:"Password is incorrect",
            })

        }



    }
    catch(error){
        return res.status(500).json({
            success : false,
            message:"Login Failure ,Please try again ",
        })
    }
}


// Controller for Changing Password
exports.changePassword = async (req, res) => {
    try {
      // Get user data from req.user
      const userDetails = await User.findById(req.user.id)
  
      // Get old password, new password, and confirm new password from req.body
      const { oldPassword, newPassword } = req.body

  
      // Validate old password
      const isPasswordMatch = await bcrypt.compare(
        oldPassword,
        userDetails.password
      )
     
      if (!isPasswordMatch) {
        // If old password does not match, return a 401 (Unauthorized) error
        return res
          .status(401)
          .json({ success: false, message: "The password is incorrect" })
      }
  
      // Update password
      const encryptedPassword = await bcrypt.hash(newPassword, 10)
      const updatedUserDetails = await User.findByIdAndUpdate(
        req.user.id,
        { password: encryptedPassword },
        { new: true }
      )
  
      // Send notification email
      try {
        const emailResponse = await mailSender(
          updatedUserDetails.email,
          "Password for your account has been updated",
          passwordUpdated(
            updatedUserDetails.email,
            `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
          )
        )
        console.log("Email sent successfully:", emailResponse.response)
      } catch (error) {
        // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while sending email:", error)
        return res.status(500).json({
          success: false,
          message: "Error occurred while sending email",
          error: error.message,
        })
      }
  
      // Return success response
      return res
        .status(200)
        .json({ success: true, message: "Password updated successfully" })
    } catch (error) {
      // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while updating password:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while updating password",
        error: error.message,
      })
    }
  }
  
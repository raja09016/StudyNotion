const Profile = require("../models/Profile");
const User = require("../models/User");
const {uploadToCloudinary} = require("../utils/imageUploader")

exports.updateProfile = async (req,res)=>{
    try{
        const{dateOfBirth="" ,about="", contactNumber , gender }= req.body;

        // get userId
        const id =req.user.id;
        // validation
        if(!contactNumber || !gender||!id ){
            return res.status(400).json({
                success:false,
                message:"All fields required"
            })
        }

        // hmlog null wwala profile push kiye the user creation ke waqt to ab usi se eprofilw id nikal lete h
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;

            // to AB profile ka object pehle se bna pda h to ssave wala method use krege
            const profileDetails = await Profile.findById(profileId);

            // update profiles
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about=about;
        profileDetails.gender=gender;
        profileDetails.contactNumber=contactNumber;
        await profileDetails.save();

        return res.status(200).json({
            success:true,
            message:"profile updated successfully"
        })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"failed to update profile details"
        })

    }
}


// delete Account

exports.deleteAccount = async (req,res)=>{
    try{
        const id =req.user.id;
      console.log("id",id)
        const userDetails = await User.findById(id);
        if(!userDetails){
            return res.status(400).json({
                success:false,
                message:"User not Found"
            })
        }

        // delete profile
        await Profile.findByIdAndDelete({
            _id:userDetails.additionalDetails,
        });
        // unenroll user from all enroll courses;

        // delet user
        await User.findByIdAndDelete({
            _id:id
        })
        return res.status(200).json({
            success:true,
            message:"User deletd successfully"
        })
    


    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User can not be deleted "
        })
    }
}



exports.getAllUserDetails = async(req,res)=>{
    try{
        const id = req.user.id;

        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        return res.status(200).json({
            success:true,
            message:"User data fetched successfully",
            userDetails
        })

    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"failed to get all user details"
        })
    }
}



exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
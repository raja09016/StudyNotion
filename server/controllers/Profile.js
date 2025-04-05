const Profile = require("../models/Profile");
const User = require("../models/User");
const {uploadToCloudinary} = require("../utils/imageUploader")
const { convertSecondsToDuration } = require("../utils/secToDuration")
const CourseProgress = require("../models/CourseProgress")
const mongoose = require("mongoose")
const Course = require("../models/Course")



exports.updateProfile = async (req,res)=>{
    try{
      const {
        firstName = "",
        lastName = "",
        dateOfBirth = "",
        about = "",
        contactNumber = "",
        gender = "",
      } = req.body

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
            const user = await User.findByIdAndUpdate(id, {
              firstName,
              lastName,
            })
            await user.save()
        
            // update profiles
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about=about;
        profileDetails.gender=gender;
        profileDetails.contactNumber=contactNumber;
        await profileDetails.save();
         // Find the updated user details
          const updatedUserDetails = await User.findById(id)
          .populate("additionalDetails")
          .exec()

        return res.status(200).json({
            success:true,
            message:"profile updated successfully",
            updatedUserDetails
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
      // console.log("aya controller ke pass",req.files.displayPicture)
      const displayPicture = req.files.displayPicture
     

      const userId = req.user.id
    
      // console.log("aya controller")
      const image = await uploadToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
     
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      ) .populate("additionalDetails")
      .exec()

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
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec()
    userDetails = userDetails.toObject()
    var SubsectionLength = 0
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0
      SubsectionLength = 0
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        )
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      })
      courseProgressCount = courseProgressCount?.completedVideos.length
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2)
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier
      }
    }

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
}

exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id })

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnroled.length
      const totalAmountGenerated = totalStudentsEnrolled * course.price

      // Create a new object with the additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        // Include other course properties as needed
        totalStudentsEnrolled,
        totalAmountGenerated,
      }

      return courseDataWithStats
    })

    res.status(200).json({ courses: courseData })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

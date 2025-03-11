const Course = require("../models/Course");
const Tag = require("../models/Category");
const User = require("../models/User");
const mongoose =require("mongoose")
// create course
const { uploadToCloudinary } = require("../utils/imageUploader");

exports.createCourse = async (req, res) => {
  try {
    // fecthing data

    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      category,
      tag,
      instructions,
      status,
    } = req.body;

    // fetching files
    const thumbnail = req.files.thumbnailImage;

    // validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !category ||
      !thumbnail ||
      !tag
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }
 
    // console.log("status",status)
    // if ( !status || status === undefined) {
		// 	status = "Draft";
		// }
    // check for instructor
    let userId = req.user.id;
    
    const instructorDetails = await User.findById(userId);
  
    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor details not found",
      });
    }
    console.log("Instructor Details", instructorDetails);
    //check given category is valid or not
    const categoryDetails = await Tag.findById(category); // here tag is id
    if (!categoryDetails) {
      return res.status(401).json({
        success: false,
        message: "Category Details not found",
      });
    }
    console.log("category Details", categoryDetails);
    // upload to cloudinary
    const thumbnailImage = await uploadToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    // create an entry for a new ciurse
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag: tag,
      category: categoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
      status: status,
			instructions: instructions,
		
    });

    // add the new course to the user schema of instructor
    console.log("newCourse", newCourse);
    await User.findByIdAndUpdate(
      
        instructorDetails._id,
      
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    // updat the tag ka schema
    await Tag.findByIdAndUpdate(
      category,
      
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    //    return response
    return res.status(200).json({
      success: true,
      message: "Course Created Successfully",
      data: newCourse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

// show all courses

exports.getAllCourses = async (req, res) => {
  try {
    // change below statement
    const allCourses = await Course.find({}).populate("instructor").exec();

    return res.status(200).json({
      success: true,
      message: "All courses are fetched",
      data: allCourses,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

// getCourseDtails

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;

    const courseDetails = await Course.find({ _id: courseId })
                                                .populate({
                                                    path: "instructor",
                                                    populate: {
                                                    path: "additionalDetails",
                                                    },
                                                })
                                                .populate("category")
                                                .populate("ratingAndReviews")
                                                .populate({
                                                    path: "courseContent",
                                                    populate: {
                                                    path: "subSection",
                                                    },
                                                })
                                                .exec();

    // validation   
    if(!courseDetails){
        return res.status(400).json({
            success:false,
            message:`Could not find the course wtih ${courseId}`,
        })
    }

    return res.status(200).json({
        success:true,
        message:"Course Details fetched successfully ",
        courseDetails,
    })

  } catch (err) {
    console.log(err)
    return res.status(500).json({    
        success:false,
        message:err.message,
    })
  }
};

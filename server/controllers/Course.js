const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const mongoose =require("mongoose")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const {convertSecondsToDuration} = require("../utils/secToDuration")
// create course
const { uploadToCloudinary } = require("../utils/imageUploader");
const {CourseProgress} = require("../models/CourseProgress")
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
    const categoryDetails = await Category.findById(category); // here tag is id
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

    // create an entry for a new course
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
    await Category.findByIdAndUpdate(
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




// Edit Course Details
exports.editCourse = async (req, res) => {
  try {

    console.log("befor ediit")
    const { courseId } = req.body
    const updates = req.body
    
    const course = await Course.findById(courseId)
    console.log("category id ",course.category)
    if (!course) {
      return res.status(404).json({ error: "Course not found" })
    }

    // If Thumbnail Image is found, update it
    if (req.files) {
      console.log("thumbnail update")
      const thumbnail = req.files.thumbnailImage
      const thumbnailImage = await uploadToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      )
      course.thumbnail = thumbnailImage.secure_url
    }

    // Update only the fields that are present in the request body
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (key === "tag" || key === "instructions") {
          course[key] = JSON.parse(updates[key])
        } else {
          course[key] = updates[key]
        }
      }
    }

    await course.save()

    const updatedCourse = await Course.findOne({
      _id: courseId,
    })
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
      .exec()
      // console.log("edit course details,",updatedCourse)
    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}





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











exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const userId = req.user.id
    console.log(" before in getfullcoursedtails",courseId)
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
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
      .exec()

      console.log(" before1 in getfullcoursedtails",courseDetails.courseName)

    // let courseProgressCount = await CourseProgress.findOne({
    //   courseID: courseId,
    //   userId: userId,
    // })
    console.log(" before2 in getfullcoursedtails")

    // console.log("courseProgressCount : ", courseProgressCount)

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        // completedVideos: courseProgressCount?.completedVideos
        //   ? courseProgressCount?.completedVideos
        //   : [],
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      // message1:"nahi ho pa rha kya",
      message: error.message,
    })
  }
}

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user or request body
    const instructorId = req.user.id

    // Find all courses belonging to the instructor
    const instructorCourses = await Course.find({
      instructor: instructorId,
    }).sort({ createdAt: -1 })

    // Return the instructor's courses
    res.status(200).json({
      success: true,
      data: instructorCourses,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    })
  }
}
// Delete the Course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body

    // Find the course
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Unenroll students from the course
    const studentsEnrolled = course.studentsEnrolled
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      })
    }

    // Delete sections and sub-sections
    const courseSections = course.courseContent
    for (const sectionId of courseSections) {
      // Delete sub-sections of the section
      const section = await Section.findById(sectionId)
      if (section) {
        const subSections = section.subSection
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId)
        }
      }

      // Delete the section
      await Section.findByIdAndDelete(sectionId)
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId)

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}
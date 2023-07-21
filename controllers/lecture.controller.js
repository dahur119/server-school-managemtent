const Lecturer = require("../models/lecture.model");
const Course = require("../models/courses.model");
const Department = require("../models/department.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Result = require("../models/result.model");
const Student = require("../models/student.model");
require("dotenv").config;

async function lecturerLogin(req, res) {
  try {
    const { username, password } = req.body;
    const lecturer = await Lecturer.findOne({ username });
    if (!lecturer) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, lecturer.password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = jwt.sign(
      { lecturerId: lecturer._id }, // Include the lecturer ID in the token payload
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );
    const refreshToken = jwt.sign(
      { _id: lecturer._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Set the refresh token as a cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred during the login",
    });
  }
}

async function lecturerLogout(req, res) {
  try {
    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      path: "/",
      expires: new Date(0),
    });

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during logout" });
  }
}

async function resetPasswordLecturer(req, res) {
  try {
    const { resetToken, newPassword } = req.body;

    const decodedToken = jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET);
    const lecturerId = decodedToken.lecturerId;

    // Find the lecturer by their ID
    const lecturer = await Lecturer.findById(lecturerId);

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer not found",
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    // Update the lecturer's password
    lecturer.password = hashedNewPassword;
    await lecturer.save();

    res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.log(error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid or expired reset token",
      });
    }
    res.status(500).json({
      message: "An error occurred while resetting the password",
    });
  }
}

async function allCourse(req, res) {
  try {
    const course = await Course.find({});
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get the list of lecturer" });
  }
}

async function allStudent(req, res) {
  try {
    const student = await Student.find({});
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get the list of lecturer" });
  }
}

async function submitResult(req, res) {
  try {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer")) {
      return res.status(401).json({
        message: "You are not authorized to submit results.",
      });
    }

    const token = authorization.split(" ")[1]; // Extract the token from "Bearer <token>"
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const lecturerId = decodedToken.lecturerId;
    const { studentId, courseId, score } = req.body;

    const lecturer = await Lecturer.findById(lecturerId);
    console.log("checkme good", lecturer);
    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer not found.",
      });
    }

    const department = lecturer.department;
    console.log("checking", department);
    if (!department) {
      return res.status(404).json({
        message: "Department not found.",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    if (!student || !student.course || !student.course.includes(courseId)) {
      return res.status(404).json({
        message: "Student is not registered for the course.",
      });
    }

    const existingResult = await Result.findOne({
      student: studentId,
      course: courseId,
      score: score,
    });

    if (existingResult) {
      return res.status(400).json({
        message: "Result already exists for this student, course, and score.",
      });
    }

    const result = new Result({
      student: studentId,
      course: courseId,
      score: score,
      approved: false,
      approvedBy: department._id, // Set the approvedBy field with the department ID
    });
    console.log("i need you", result);
    await result.save();

    lecturer.results.push(result._id);
    await lecturer.save();

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const studentDetails = {
      studentId: student._id,
      studentName: student.name,
      courseId: course._id,
      courseName: course.courseName,
    };
    console.log(studentDetails);

    res.status(200).json({
      message: "Result submitted successfully.",
      student: studentDetails,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Invalid token.",
      });
    }
    res.status(500).json({
      message: "An error occurred while submitting the result.",
    });
  }
}

async function getStudentIdCourses(req, res) {
  try {
    const { studentId } = req.params;

    const studentCourses = await Course.find({ student: studentId });
    console.log("sick", studentCourses);

    res.status(200).json(studentCourses);
  } catch (error) {
    console.error("Error retrieving student courses:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function updateResult(req, res) {
  try {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "You are not authorized to submit results.",
      });
    }

    const token = authorization.split(" ")[1]; // Extract the token from "Bearer <token>"
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const { studentId, courseId, score } = req.body;
    const lecturerId = decodedToken.lecturerId;
    console.log(lecturerId, "kjdkodoodod");

    //check if the lecturer is logged in and get thier ID

    if (!lecturerId) {
      return res.status(401).json({
        message: "you're not not authorized to sumbit result",
      });
    }
    // Check if the lecturer is associated with the result they are trying to
    const result = await Result.findOne({
      student: studentId,
      course: courseId,
    });
    if (!result) {
      return res.status(401).json({
        message: "Result not found",
      });
    }
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer.results.includes(result._id)) {
      lecturer.results.push(result._id);
      await lecturer.save();
    }
    result.score = score;
    await result.save();
    res.status(200).json({
      message: "'Result updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred while updating the result.",
    });
  }
}

async function LecturerViewResult(req, res) {
  try {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer")) {
      return res.status(401).json({
        message: "You are not authorized to submit results.",
      });
    }

    const token = authorization.split(" ")[1]; // Extract the token from "Bearer <token>"
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const lecturerId = decodedToken.lecturerId;
    console.log("hello you ", lecturerId);

    const lecturer = await Lecturer.findOne({ _id: lecturerId })
      .populate({
        path: "results",
        populate: [
          { path: "student", select: "name" }, // Populate student name only
          { path: "course", select: "credit courseName" }, // Populate course name only
        ],
      })
      .exec();
    console.log(lecturer);

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer does not exist",
      });
    }

    const populatedResults = lecturer.results.map((result) => ({
      student: result.student.name,
      course: result.course.credit,
      name: result.course.courseName,
      score: result.score,
    }));

    res.json(populatedResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
}

module.exports = {
  resetPasswordLecturer,
  lecturerLogin,
  submitResult,
  updateResult,
  allCourse,
  allStudent,
  LecturerViewResult,
  lecturerLogout,
  getStudentIdCourses,
};

const Course = require("../models/courses.model");
const Student = require("../models/student.model");
const Result = require("../models/result.model");
const jwt = require("jsonwebtoken");
require("dotenv").config;

const bcrypt = require("bcrypt");
const Lecturer = require("../models/lecture.model");

async function registerStudent(req, res) {
  try {
    const { name, email, password, year, level } = req.body;

    // check if the email already exist
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }
    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create a new student
    const student = new Student({
      name,
      email,
      password: hashedPassword,
      year,
      level,
    });
    await student.save();

    const accessToken = jwt.sign(
      { _id: student._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );
    res.status(200).json({
      message: "Student registered successfully",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred during student registration",
    });
  }
}

async function studentLogin(req, res) {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, student.password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    const accessToken = jwt.sign(
      { _id: student._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );
    const refreshToken = jwt.sign(
      { _id: student._id },
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
      message: "An error occurred during student login",
    });
  }
}

async function registerCourse(req, res) {
  const { authorization } = req.headers; // Retrieve the JWT token from the request headers

  try {
    // Verify and decode the JWT token
    const token = authorization.split(" ")[1]; // Extract the token from "Bearer <token>"
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const { _id: studentId } = decodedToken; // Extract the student ID from the decoded token
    const { courseName, credit, lecturerId } = req.body;

    // Find the student in the database
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Find or create the course based on the course name
    let course = await Course.findOne({ courseName });
    if (!course) {
      // Create a new course if it doesn't exist
      course = new Course({
        courseName,
        credit,
        lecturer: lecturerId,
      });
      await course.save();
    }

    if (student.course.includes(course._id)) {
      return res.status(400).json({
        error: "Course already registered",
      });
    }

    // Add the course to the student's registered courses
    student.course.push(course._id);

    // Save the updated student object
    await student.save();

    res.json({ message: "Course registration successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register for the course" });
  }
}

async function allLecture(req, res) {
  try {
    const lecturer = await Lecturer.find({});
    res.json(lecturer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get the list of lecturer" });
  }
}
async function viewResult(req, res) {
  const { authorization } = req.headers;
  try {
    const token = authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const studentId = decodedToken._id;

    const student = await Student.findById(studentId);
    console.log("func the studnebt ", student);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Find all results associated with the student ID
    const results = await Result.find({ student: student._id }).populate(
      "course"
    );

    // Return the student with their results in the response
    return res.status(200).json({ student, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to retrieve results",
    });
  }
}

function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({
      error: "Refresh token not provided",
    });
  }
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err, decodedToken) => {
      if (err) {
        return res.status(401).json({
          error: "Invalid refresh token",
        });
      }

      const accessToken = jwt.sign(
        { userId: decodedToken.userId },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "15m", // Set the expiration time for the new access token
        }
      );

      res.cookie("accessToken", accessToken, { httpOnly: true });

      res.json({ message: "Token refreshed successfully" });
    }
  );
}

async function getRegisteredCourse(req, res) {
  const { authorization } = req.headers;

  try {
    const token = authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const { _id: studentId } = decodedToken;

    const student = await Student.findById(studentId).populate({
      path: "course",
      select: "courseName credit lecturer", // Select the necessary fields from the "courses" model
      populate: {
        path: "lecturer",
        select: "name", // Select the "name" field from the "lecturer" model
      },
    });
    if (!student) {
      return res.status(404).json({
        error: "Student not found",
      });
    }
    const registeredCourses = student.course.map((course) => ({
      _id: course._id,
      courseName: course.courseName,
      credit: course.credit,
      lecturer: course.lecturer ? course.lecturer.name : "Unknown Lecturer", // Access the lecturer's name from the populated "lecturer" field
    }));

    res.json(registeredCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to retrieve registered courses",
    });
  }
}
async function studentLogout(req, res) {
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

module.exports = {
  registerStudent,
  studentLogin,
  registerCourse,
  viewResult,
  allLecture,
  studentLogout,
  refreshToken,
  getRegisteredCourse,
};

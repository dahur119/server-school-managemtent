const bcrypt = require("bcrypt");
const Student = require("../models/student.model");
const Department = require("../models/department.model");
const Lecturer = require("../models/lecture.model");
const Result = require("../models/result.model");
const Course = require("../models/courses.model");
const jwt = require("jsonwebtoken");
require("dotenv").config;

async function createDepartmentRecords(req, res) {
  try {
    // Clear existing department records
    await Department.deleteMany();

    const departments = [
      {
        name: "computer science",
        username: "deptA",
        password: "password1",
      },
      {
        name: "Department B",
        username: "deptB",
        password: "password2",
      },
      // Add more departments as needed
    ];

    const departmentWithHashedPasswords = await Promise.all(
      departments.map(async (department) => {
        const hashedPassword = await bcrypt.hash(department.password, 10);
        return {
          name: department.name,
          username: department.username,
          password: hashedPassword,
        };
      })
    );

    await Department.insertMany(departmentWithHashedPasswords);

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { role: "admin" }, // Set the payload as needed
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    const refreshToken = jwt.sign(
      { role: "admin" }, // Set the payload as needed
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Department record created successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(
      "An error occurred while creating department records:",
      error
    );
    res.status(500).json({ message: "Error creating department records." });
  }
}

async function deptLogin(req, res) {
  try {
    const { username, password } = req.body;

    const department = await Department.findOne({ username });
    if (!department) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, department.password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = jwt.sign(
      { _id: department._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );
    const refreshToken = jwt.sign(
      { _id: department._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Set the refresh token as a cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    res.status(200).json({
      accessToken,
      refreshToken,
      message: "Department logged in successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred during Department login",
    });
  }
}

async function DeptLogout(req, res) {
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

async function registerLecturer(req, res) {
  const { name, username, password } = req.body;
  const { authorization } = req.headers;

  try {
    const token = authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const departmentId = decodedToken._id;
    let department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    const hashedNewPassword = await bcrypt.hash(password, 10);
    const lecturer = await Lecturer.create({
      name,
      username,
      password: hashedNewPassword,
      department: department._id,
    });

    await lecturer.save();
    const accessToken = jwt.sign(
      { _id: lecturer._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );
    res.status(200).json({
      message: "Lecturer registered successfully",
      accessToken,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Lecturer name already exists",
      });
    }

    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while registering the lecturer" });
  }
}

async function getAllDepartments(req, res) {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve department names" });
  }
}

const getAllStudentResults = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const departmentId = decodedToken._id;
    if (!departmentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Retrieve all student results
    const results = await Result.find({ approvedBy: departmentId })
      .populate("student", "name")
      .populate("course", "courseName");

    console.log(results);
    return res.status(200).json(results);
  } catch (error) {
    console.error("Error retrieving student results:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

async function getRegisteredStudents(req, res) {
  const { authorization } = req.headers;
  try {
    const token = authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const studentId = decodedToken._id;

    const course = await Course.findById(studentId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }
    const students = await Student.find({ courses: courseId });
    res.status(200).json({
      courseName: course.courseName,
      registerStudent: students,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred while approving the result",
    });
  }
}

async function generateResultId(req, res) {
  try {
    const result = new Result();
    const resultId = result._id;

    res.status(200).json(resultId);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while generating the result ID." });
  }
}

async function approveResult(req, res) {
  const resultId = req.params.resultId;
  const { authorization } = req.headers;

  try {
    if (!authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const departmentId = decodedToken._id;

    if (!departmentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await Result.findById(resultId)
      .populate("course", "courseName")
      .populate("student", "name")
      .populate("score");
    if (!result) {
      return res.status(404).json({ message: "Result not found." });
    }

    // Check if the department is authorized to approve the result
    if (
      result.departmentId &&
      departmentId &&
      result.departmentId.toString() !== departmentId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to approve this result." });
    }

    result.approved = true;
    await result.save();

    return res
      .status(200)
      .json({ message: "Result approved successfully.", result });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while approving the result." });
  }
}

async function getAllLecturer(req, res) {
  const { authorization } = req.headers;
  try {
    if (!authorization) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const departmentId = decodedToken._id;
    console.log(departmentId);

    const lecturer = await Lecturer.find({ department: departmentId })
      .populate("department", "name")
      .select("username name password");

    if (lecturer.length === 0) {
      return res.status(404).json({
        message: "Lecturer not found",
      });
    }
    res.status(200).json(lecturer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function getStudentIdCourses(req, res) {
  try {
    const { studentId } = req.params;

    const studentCourses = await Course.find({ lecturer: studentId });

    res.status(200).json(studentCourses);
  } catch (error) {
    console.error("Error retrieving student courses:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  registerLecturer,
  createDepartmentRecords,
  getAllStudentResults,
  approveResult,
  getAllLecturer,
  getRegisteredStudents,
  getAllDepartments,
  getAllDepartments,
  deptLogin,
  DeptLogout,
  generateResultId,
};

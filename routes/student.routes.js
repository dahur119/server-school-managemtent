const express = require("express");

const {
  registerStudent,
  studentLogin,
  registerCourse,
  viewResult,
  allLecture,
  studentLogout,
  refreshToken,
  getRegisteredCourse,
} = require("../controllers/student.controller");
const verifyJWT = require("../middleware/verifyJwt");
const studentRouter = express.Router();

studentRouter.post("/register", registerStudent);
studentRouter.post("/login", studentLogin);
studentRouter.post("/logout", studentLogout);
studentRouter.post("/register-course", verifyJWT, registerCourse);
studentRouter.get("/all-lecturer", allLecture);
studentRouter.get("/all-courses", verifyJWT, getRegisteredCourse);
studentRouter.get("/result", verifyJWT, viewResult);
studentRouter.get("/refresh", refreshToken);
// studentRouter.put("/editCourse", editCourse);
// studentRouter.get("/results", viewResult);
module.exports = studentRouter;

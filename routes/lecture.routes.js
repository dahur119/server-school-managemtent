const express = require("express");

const {
  resetPasswordLecturer,
  lecturerLogin,
  submitResult,
  updateResult,
  allCourse,
  allStudent,
  lecturerLogout,
  LecturerViewResult,
  getStudentIdCourses,
} = require("../controllers/lecture.controller");
const verifyJWT = require("../middleware/verifyJwt");

const lectureRouter = express.Router();

lectureRouter.post("/reset-password", resetPasswordLecturer);
lectureRouter.post("/logout", lecturerLogout);
lectureRouter.post("/login", lecturerLogin);
lectureRouter.get("/view-result", verifyJWT, LecturerViewResult);
lectureRouter.get("/all-student", allStudent);
lectureRouter.get("/all-courses", allCourse);
lectureRouter.post("/submit", verifyJWT, submitResult);
lectureRouter.put("/update", verifyJWT, updateResult);
lectureRouter.get("/:studentId/courses", getStudentIdCourses);

module.exports = lectureRouter;

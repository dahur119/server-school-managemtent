const express = require("express");

const {
  registerLecturer,
  createDepartmentRecords,
  getAllStudentResults,
  getRegisteredStudents,
  getAllDepartments,
  deptLogin,
  DeptLogout,
  generateResultId,
  approveResult,
  getAllLecturer,
} = require("../controllers/department.controller");
const verifyJWT = require("../middleware/verifyJwt");
const departmentRouter = express.Router();

departmentRouter.post("/register", verifyJWT, registerLecturer);
departmentRouter.post("/login", deptLogin);
departmentRouter.post("/logout", DeptLogout);
departmentRouter.post(
  "/create-records",

  createDepartmentRecords
);
departmentRouter.get("/results", getAllStudentResults);
departmentRouter.get("/all-departments", getAllDepartments);
departmentRouter.put(
  "/:resultId/approve",

  approveResult
);

departmentRouter.get(
  "/all-lecturer",

  getAllLecturer
);
departmentRouter.get(
  "/:courseId/students",

  getRegisteredStudents
);

departmentRouter.get(
  "/resultId",
  verifyJWT,

  generateResultId
);
departmentRouter.post("/departments", createDepartmentRecords);

module.exports = departmentRouter;

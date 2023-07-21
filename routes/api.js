const express = require("express");
const lectureRouter = require("./lecture.routes");
const studentRouter = require("./student.routes");
const departmentRouter = require("./department.routes");

const api = express.Router();

api.use("/lecturer", lectureRouter);
api.use("/student", studentRouter);
api.use("/departments", departmentRouter);

module.exports = api;

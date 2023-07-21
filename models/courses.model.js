const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const courseSchema = new Schema({
  courseName: { type: String, required: true },
  credit: { type: Number, required: true },
  lecturer: { type: Schema.Types.ObjectId, ref: "Lecturer", required: true },
  results: [{ type: Schema.Types.ObjectId, ref: "Result" }],
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;

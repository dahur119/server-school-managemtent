const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const resultSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  score: { type: Number, required: true },
  approved: { type: Boolean, default: false },
  approvedBy: { type: Schema.Types.ObjectId, ref: "Department" },
});

const Result = mongoose.model("Result", resultSchema);
module.exports = Result;

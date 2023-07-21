const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const lectureSchema = new Schema({
  name: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  results: [{ type: Schema.Types.ObjectId, ref: "Result" }],
});

const Lecture = mongoose.model("Lecturer", lectureSchema);

module.exports = Lecture;

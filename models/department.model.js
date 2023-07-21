const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const departmentSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;

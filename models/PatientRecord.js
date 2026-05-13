import mongoose from "mongoose";

const PatientRecordSchema = new mongoose.Schema(
  {
    patientId: String,
    fullName: String,
    age: Number,
    gender: String,
    bloodGroup: String,
    height: Number,

    vitals: {
      bloodPressure: String,
      heartRate: String,
      bloodSugar: String,
      temperature: String,
      spo2: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("PatientRecord", PatientRecordSchema);

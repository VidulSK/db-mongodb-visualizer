import { Schema } from 'mongoose';
import { primaryConnection } from '../config.js';

const StudentSchema = new Schema({
  "First Name": { type: String, required: true },
  "Last Name": { type: String, required: true },
  "Whatsapp Number": { type: String, required: true, unique: true },
  "Subject Stream": { type: String, required: true },
  "Medium": { type: String, required: true },
  "Preferred Exam Center": { type: String, required: true },
  "exam_center_confirmed26": { type: Boolean, default: false } // Boolean type matching the database
}, { timestamps: true });

// Explicitly compile the model on the collection 'sme26registrations'
const Student = primaryConnection.model('Student', StudentSchema, 'sme26registrations');

export default Student;

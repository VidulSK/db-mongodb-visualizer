import { Schema } from 'mongoose';
import { primaryConnection } from '../config.js';

const StudentSchema = new Schema({
  "First Name": { type: String, required: true },
  "Last Name": { type: String, required: true },
  "WhatsApp Number": { type: String },
  "Whatsapp Number": { type: String },
  "Subject Stream": { type: String, required: true },
  "Medium": { type: String, required: true },
  "final_exam_center": { type: String, required: true },
  "exam_center_confirmed26": { type: Boolean, default: false }, // Boolean type matching the database
  "NIC": { type: String },
  "attended_days": { type: [String], default: [] }
}, { timestamps: true });

// Explicitly compile the model on the collection 'sme26registrations'
const Student = primaryConnection.model('Student', StudentSchema, 'sme26registrations');

export default Student;

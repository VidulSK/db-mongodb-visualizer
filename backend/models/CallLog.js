import { Schema } from 'mongoose';
import { secondaryConnection } from '../config.js';

const CallLogSchema = new Schema({
  whatsappNumber: { type: String, required: true, unique: true },
  name: { type: String },
  nic: { type: String },
  participationConfirmed: { type: Boolean, required: true },
  calledAt: { type: Date, default: Date.now },
  examCenter: { type: String },
  studentId: { type: String }
}, { timestamps: true });

const CallLog = secondaryConnection.model('CallLog', CallLogSchema);

export default CallLog;

import { Schema } from 'mongoose';
import { secondaryConnection } from '../config.js';

const CallLogSchema = new Schema({
  whatsappNumber: { type: String, required: true, unique: true },
  callTaken: { type: Boolean, default: true },
  calledAt: { type: Date, default: Date.now },
  participationConfirmed: { type: Boolean, default: null },
  firstName: { type: String },
  lastName: { type: String },
  examCenter: { type: String },
  nic: { type: String },
  studentId: { type: String }
}, { timestamps: true });

const CallLog = secondaryConnection.model('CallLog', CallLogSchema);

export default CallLog;

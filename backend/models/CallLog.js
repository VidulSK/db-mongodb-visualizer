import { Schema } from 'mongoose';
import { secondaryConnection } from '../config.js';

const CallLogSchema = new Schema({
  whatsappNumber: { type: String, required: true, unique: true },
  callTaken: { type: Boolean, default: true },
  calledAt: { type: Date, default: Date.now },
  participationConfirmed: { type: Boolean, default: null }
}, { timestamps: true });

const CallLog = secondaryConnection.model('CallLog', CallLogSchema);

export default CallLog;

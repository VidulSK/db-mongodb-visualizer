import mongoose from 'mongoose';
import Student from './models/Student.js';
import CallLog from './models/CallLog.js';
import { primaryConnection, secondaryConnection } from './config.js';

const mockStudents = [
  { firstName: "Avantha", lastName: "Perera", whatsappNumber: "+94711234567", subjectStream: "Physical Science", medium: "Sinhala", preferredExamCenter: "Colombo Center A", exam_center_confirmed26: "true" },
  { firstName: "Dilshan", lastName: "Silva", whatsappNumber: "+94771234568", subjectStream: "Physical Science", medium: "English", preferredExamCenter: "Colombo Center A", exam_center_confirmed26: "false" },
  { firstName: "Fathima", lastName: "Asma", whatsappNumber: "+94721234569", subjectStream: "Biological Science", medium: "Tamil", preferredExamCenter: "Jaffna Center D", exam_center_confirmed26: "true" },
  { firstName: "Tharindu", lastName: "Bandara", whatsappNumber: "+94751234570", subjectStream: "Biological Science", medium: "Sinhala", preferredExamCenter: "Kandy Center C", exam_center_confirmed26: "false" },
  { firstName: "Sanduni", lastName: "Fernando", whatsappNumber: "+94761234571", subjectStream: "Commerce", medium: "English", preferredExamCenter: "Colombo Center A", exam_center_confirmed26: "true" },
  { firstName: "Kavindu", lastName: "Jayawardena", whatsappNumber: "+94701234572", subjectStream: "Physical Science", medium: "Sinhala", preferredExamCenter: "Galle Center B", exam_center_confirmed26: "true" },
  { firstName: "Nisal", lastName: "Gunasekara", whatsappNumber: "+94712345673", subjectStream: "Arts", medium: "Sinhala", preferredExamCenter: "Galle Center B", exam_center_confirmed26: "false" },
  { firstName: "Priya", lastName: "Ramanathan", whatsappNumber: "+94773456789", subjectStream: "Commerce", medium: "Tamil", preferredExamCenter: "Jaffna Center D", exam_center_confirmed26: "false" },
  { firstName: "Minura", lastName: "Senanayake", whatsappNumber: "+94715566778", subjectStream: "Arts", medium: "English", preferredExamCenter: "Kandy Center C", exam_center_confirmed26: "true" },
  { firstName: "Ruvini", lastName: "Edirisinghe", whatsappNumber: "+94769988776", subjectStream: "Biological Science", medium: "Sinhala", preferredExamCenter: "Colombo Center A", exam_center_confirmed26: "false" },
  { firstName: "Karthik", lastName: "Subramaniam", whatsappNumber: "+94778899001", subjectStream: "Physical Science", medium: "Tamil", preferredExamCenter: "Jaffna Center D", exam_center_confirmed26: "true" },
  { firstName: "Hansani", lastName: "Dissanayake", whatsappNumber: "+94726677889", subjectStream: "Commerce", medium: "Sinhala", preferredExamCenter: "Kandy Center C", exam_center_confirmed26: "true" },
  { firstName: "Chamila", lastName: "Ranasinghe", whatsappNumber: "+94759900112", subjectStream: "Arts", medium: "Sinhala", preferredExamCenter: "Galle Center B", exam_center_confirmed26: "true" },
  { firstName: "Michelle", lastName: "De Alwis", whatsappNumber: "+94701122334", subjectStream: "Biological Science", medium: "English", preferredExamCenter: "Colombo Center A", exam_center_confirmed26: "false" },
  { firstName: "Abdul", lastName: "Hameed", whatsappNumber: "+94776655443", subjectStream: "Commerce", medium: "Tamil", preferredExamCenter: "Colombo Center A", exam_center_confirmed26: "true" }
];

async function seed() {
  try {
    // Wait for connections to open
    await new Promise((resolve) => {
      let readyCount = 0;
      const check = () => {
        readyCount++;
        if (readyCount === 2) resolve();
      };
      if (primaryConnection.readyState === 1) check();
      else primaryConnection.once('open', check);

      if (secondaryConnection.readyState === 1) check();
      else secondaryConnection.once('open', check);
    });

    console.log("Databases ready for seeding...");

    // Clear primary
    await Student.deleteMany({});
    console.log("Cleared Primary Database Students.");

    // Clear secondary
    await CallLog.deleteMany({});
    console.log("Cleared Secondary Database CallLogs.");

    // Insert primary
    await Student.insertMany(mockStudents);
    console.log(`Successfully seeded Primary Database with ${mockStudents.length} students.`);

    // Insert one initial call log for testing
    await CallLog.create({ whatsappNumber: "+94711234567", callTaken: true });
    console.log("Seeded initial Call Log for Avantha Perera (+94711234567).");

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    // Close connections
    await primaryConnection.close();
    await secondaryConnection.close();
    console.log("Connections closed.");
    process.exit(0);
  }
}

seed();

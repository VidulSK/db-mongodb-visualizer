import mongoose from 'mongoose';
import Student, { StudentSme25 } from './models/Student.js';
import CallLog from './models/CallLog.js';
import { primaryConnection, secondaryConnection } from './config.js';

const mockStudents = [
  { "First Name": "Avantha", "Last Name": "Perera", "Whatsapp Number": "+94711234567", "Subject Stream": "Physical Science", "Medium": "Sinhala", "final_exam_center": "Colombo Center A", "exam_center_confirmed26": true, "NIC": "200500100200", "attended_days": ["2026-06-01", "2026-06-02"] },
  { "First Name": "Dilshan", "Last Name": "Silva", "Whatsapp Number": "+94771234568", "Subject Stream": "Physical Science", "Medium": "English", "final_exam_center": "Colombo Center A", "exam_center_confirmed26": false, "NIC": "200500100201", "attended_days": ["2026-06-01"] },
  { "First Name": "Fathima", "Last Name": "Asma", "Whatsapp Number": "+94721234569", "Subject Stream": "Biological Science", "Medium": "Tamil", "final_exam_center": "Jaffna Center D", "exam_center_confirmed26": true, "NIC": "200500100202", "attended_days": ["2026-06-02", "2026-06-03"] },
  { "First Name": "Tharindu", "Last Name": "Bandara", "Whatsapp Number": "+94751234570", "Subject Stream": "Biological Science", "Medium": "Sinhala", "final_exam_center": "Kandy Center C", "exam_center_confirmed26": false, "NIC": "200500100203", "attended_days": [] },
  { "First Name": "Sanduni", "Last Name": "Fernando", "Whatsapp Number": "+94761234571", "Subject Stream": "Commerce", "Medium": "English", "final_exam_center": "Colombo Center A", "exam_center_confirmed26": true, "NIC": "200500100204", "attended_days": ["2026-06-01", "2026-06-03"] },
  { "First Name": "Kavindu", "Last Name": "Jayawardena", "Whatsapp Number": "+94701234572", "Subject Stream": "Physical Science", "Medium": "Sinhala", "final_exam_center": "Galle Center B", "exam_center_confirmed26": true, "NIC": "200500100205", "attended_days": ["2026-06-01", "2026-06-02", "2026-06-03"] },
  { "First Name": "Nisal", "Last Name": "Gunasekara", "Whatsapp Number": "+94701234573", "Subject Stream": "Arts", "Medium": "Sinhala", "final_exam_center": "Galle Center B", "exam_center_confirmed26": false, "NIC": "200500100206", "attended_days": [] },
  { "First Name": "Priya", "Last Name": "Ramanathan", "Whatsapp Number": "+94773456789", "Subject Stream": "Commerce", "Medium": "Tamil", "final_exam_center": "Jaffna Center D", "exam_center_confirmed26": false, "NIC": "200500100207", "attended_days": ["2026-06-02"] },
  { "First Name": "Minura", "Last Name": "Senanayake", "Whatsapp Number": "+94715566778", "Subject Stream": "Arts", "Medium": "English", "final_exam_center": "Kandy Center C", "exam_center_confirmed26": true, "NIC": "200500100208", "attended_days": ["2026-06-01", "2026-06-02"] },
  { "First Name": "Ruvini", "Last Name": "Edirisinghe", "Whatsapp Number": "+94769988776", "Subject Stream": "Biological Science", "Medium": "Sinhala", "final_exam_center": "Colombo Center A", "exam_center_confirmed26": false, "NIC": "200500100209", "attended_days": [] }
];

const mockStudents25 = [
  { "First Name": "Kasun", "Last Name": "Bandara", "Whatsapp Number": "+94770001111", "Subject Stream": "Physical Science", "Medium": "Sinhala", "final_exam_center": "Colombo Center A", "exam_center_confirmed26": " true", "NIC": "200400100200", "attended_days": ["2026-06-01"] },
  { "First Name": "Nimal", "Last Name": "Siriwardena", "Whatsapp Number": "+94770002222", "Subject Stream": "Physical Science", "Medium": "Sinhala", "final_exam_center": "Kandy Center C", "exam_center_confirmed26": "false", "NIC": "200400100201", "attended_days": ["2026-06-02"] },
  { "First Name": "Ruwan", "Last Name": "Kumara", "Whatsapp Number": "+94770003333", "Subject Stream": "Biological Science", "Medium": "English", "final_exam_center": "Galle Center B", "exam_center_confirmed26": true, "NIC": "200400100202", "attended_days": ["2026-06-01", "2026-06-03"] }
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

    // Clear primary sme26registrations
    await Student.deleteMany({});
    console.log("Cleared Primary Database sme26registrations.");

    // Clear primary sme25registrations
    await StudentSme25.deleteMany({});
    console.log("Cleared Primary Database sme25registrations.");

    // Clear secondary
    await CallLog.deleteMany({});
    console.log("Cleared Secondary Database CallLogs.");

    // Insert primary sme26registrations
    await Student.insertMany(mockStudents);
    console.log(`Successfully seeded sme26registrations with ${mockStudents.length} students.`);

    // Insert primary sme25registrations
    await StudentSme25.insertMany(mockStudents25);
    console.log(`Successfully seeded sme25registrations with ${mockStudents25.length} students.`);

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

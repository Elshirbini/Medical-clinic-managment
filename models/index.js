import { Appointment } from "./appointment.js";
import { Invoice } from "./invoice.js";
import { MedicalRecord } from "./medicalRecord.js";
import { Notification } from "./notification.js";
import { Patient } from "./patient.js";

Patient.hasMany(Appointment, { foreignKey: "patient_id" });
Appointment.belongsTo(Patient, { foreignKey: "patient_id" });

Patient.hasMany(MedicalRecord, { foreignKey: "patient_id" });
MedicalRecord.belongsTo(Patient, { foreignKey: "patient_id" });

Patient.hasMany(Invoice, { foreignKey: "patient_id" });
Invoice.belongsTo(Patient, { foreignKey: "patient_id" });

Patient.hasMany(Notification, { foreignKey: "patient_id" });
Notification.belongsTo(Patient, { foreignKey: "patient_id" });

Appointment.hasMany(MedicalRecord, { foreignKey: "appointment_id" });
MedicalRecord.belongsTo(Appointment, { foreignKey: "appointment_id" });

export { Patient, Appointment, MedicalRecord, Invoice, Notification };

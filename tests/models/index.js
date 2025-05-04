import { Appointment } from "./appointment.js";
import { Invoice } from "./invoice.js";
import { MedicalRecord } from "./medicalRecord.js";
import { Notification } from "./notification.js";
import { Patient } from "./patient.js";
import { Conversation } from "./Consultation.js";
import { Message } from "./Consultation.js";
import { Admin } from "./admin.js";

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

Conversation.belongsTo(Patient, { foreignKey: "patient_id" });
Patient.hasOne(Conversation, { foreignKey: "patient_id" });

Conversation.belongsTo(Admin, { foreignKey: "admin_id" });
Admin.hasMany(Conversation, { foreignKey: "admin_id" });

Message.belongsTo(Conversation, {
  foreignKey: "conversation_id",
  onDelete: "CASCADE",
});
Conversation.hasMany(Message, {
  foreignKey: "conversation_id",
  onDelete: "CASCADE",
});

export {
  Patient,
  Appointment,
  MedicalRecord,
  Invoice,
  Notification,
  Admin,
  Message,
  Conversation,
};

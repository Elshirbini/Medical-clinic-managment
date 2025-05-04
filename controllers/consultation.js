import {
  Conversation,
  Message,
  Notification,
  Admin,
  Patient,
} from "../models/index.js";
import { ApiError } from "../utils/apiError.js";
import { emitNotification } from "../socket.js";

export const startConversationWithDoctor = async (req, res) => {
  const patientId = req.userId;

  const doctor = await Admin.findOne({ where: { role: "superAdmin" } });
  if (!doctor) throw new ApiError("Doctor not found", 404);

  const [conversation, created] = await Conversation.findOrCreate({
    where: { patient_id: patientId },
    defaults: { patient_id: patientId, doctor_id: doctor.admin_id },
  });

  const messages = await Message.findAll({
    where: { conversation_id: conversation.conversation_id },
    order: [["createdAt", "DESC"]],
  });

  const statusCode = created ? 201 : 200;
  res
    .status(statusCode)
    .json({ doctorName: doctor.userName, conversation, messages });
};

export const getAllConversation = async (req, res) => {
  const conversations = await Conversation.findAll({
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: Patient,
        attributes: ["name"],
      },
      {
        model: Message,
        attributes: ["createdAt"],
        limit: 1,
        order: [["createdAt", "DESC"]],
      },
    ],
  });

  console.log(conversations);

  if (!conversations || conversations.length === 0) {
    throw new ApiError("No conversations found", 404);
  }

  // Sort conversations based on the latest message
  const sortedConversations = conversations.sort((a, b) => {
    const aLastMessage = a.Messages[0]?.createdAt || a.createdAt;
    const bLastMessage = b.Messages[0]?.createdAt || b.createdAt;
    return new Date(bLastMessage) - new Date(aLastMessage);
  });

  const conversationsWithPatients = sortedConversations.map((conversation) => ({
    conversation,
    patientName: conversation.patient.name,
  }));

  res.status(200).json({ conversations: conversationsWithPatients });
};

export const getConversation = async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findByPk(conversationId, {
    include: [
      {
        model: Patient,
        attributes: ["name"],
      },
    ],
  });
  if (!conversation) throw new ApiError("Conversation not found", 404);
  console.log(conversation);

  const messages = await Message.findAll({
    where: { conversation_id: conversation.conversation_id },
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({ conversation, messages });
};

export const closeConversation = async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw new ApiError("Conversation not found", 404);

  conversation.isClosed = true;
  await conversation.save();

  res
    .status(200)
    .json({ message: "Conversation closed successfully", conversation });
};

export const openConversation = async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw new ApiError("Conversation not found", 404);

  conversation.isClosed = false;
  await conversation.save();

  res
    .status(200)
    .json({ message: "Conversation opened successfully", conversation });
};

export const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw new ApiError("Conversation not found", 404);

  await conversation.destroy();

  res.status(200).json({ message: "Conversation deleted successfully" });
};

export const sendMessage = async (req, res) => {
  const { message } = req.body;
  const { conversationId } = req.params;
  const userId = req.userId;
  const userRole = req.userRole;

  if (userRole && userRole === "admin") {
    throw new ApiError("You don't have any permissions to do this action", 403);
  }

  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw new ApiError("Conversation not found", 404);

  if (conversation.isClosed) throw new ApiError("Conversation was closed", 403);

  const messageSent = await Message.create({
    conversation_id: conversationId,
    sender_id: userId,
    senderType: userRole ? "doctor" : "patient",
    message,
  });

  // Create notification if the message is from a patient
  if (!userRole) {
    const patient = await Patient.findByPk(userId);
    const notification = await Notification.create({
      patient_id: userId,
      message: `New message from patient ${patient.name}: ${message}`,
      status: "consultation",
    });

    // Emit notification to doctor in real-time
    emitNotification({
      id: notification.notification_id,
      conversation_id: conversation.consultation_id,
      message: notification.message,
      patientName: patient.name,
      createdAt: notification.createdAt,
    });
  }

  res.status(200).json({ message: messageSent });
};

export const getRecentNotifications = async (req, res) => {
  const notifications = await Notification.findAll({
    order: [["createdAt", "DESC"]],
    limit: 10,
    include: [
      {
        model: Patient,
        attributes: ["name"],
      },
    ],
  });

  res.status(200).json({ notifications });
};

import express from "express";
import {
  getAllConversation,
  closeConversation,
  openConversation,
  getConversation,
  startConversationWithDoctor,
  sendMessage,
  deleteConversation,
  getRecentNotifications,
} from "../controllers/consultation.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { restrictTo } from "../middlewares/restrictTo.js";

const router = express.Router();

router.post("/start-conversation", verifyToken, startConversationWithDoctor);
router.post("/send-message/:conversationId", verifyToken, sendMessage);
router.patch(
  "/close-conversation/:conversationId",
  verifyToken,
  restrictTo("superAdmin"),
  closeConversation
);
router.patch(
  "/open-conversation/:conversationId",
  verifyToken,
  restrictTo("superAdmin"),
  openConversation
);
router.delete(
  "/delete-conversation/:conversationId",
  verifyToken,
  restrictTo("superAdmin"),
  deleteConversation
);
router.get(
  "/conversations",
  verifyToken,
  restrictTo("superAdmin"),
  getAllConversation
);
router.get(
  "/conversation/:conversationId",
  verifyToken,
  restrictTo("superAdmin"),
  getConversation
);
router.get(
  "/recent-notifications",
  verifyToken,
  restrictTo("superAdmin"),
  getRecentNotifications
);

export const consultationRoutes = router;

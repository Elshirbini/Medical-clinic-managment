import { Server } from "socket.io";
let io;

export const setUpSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 A user connected:", socket.id);

    // Join doctor room if user is superAdmin
    socket.on("join-doctor-room", () => {
      socket.join("doctor-room");
      console.log("👨‍⚕️ Doctor joined the room");
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const emitNotification = (notification) => {
  const io = getIO();
  io.to("doctor-room").emit("new-notification", notification);
};

import { randomInt } from "crypto";

export const generateOTP = () => randomInt(1000, 9999).toString();

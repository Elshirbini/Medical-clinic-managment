import axios from "axios";
import { configDotenv } from "dotenv";
import { ApiError } from "./apiError.js";
configDotenv();

export const sendToWhatsapp = async (phone, template, text) => {
  try {
    let buttonObj = null;
    if (template === "otp") {
      buttonObj = {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    }

    const components = [
      {
        type: "body",
        parameters: [
          {
            type: "text",
            text: text,
          },
        ],
      },
      buttonObj,
    ].filter(Boolean);

    const response = await axios({
      url: process.env.WHATSAPP_API_URL,
      method: "post",
      headers: {
        Authorization: `Bearer ${process.env.BUSINESS_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        messaging_product: "whatsapp",
        to: `2${phone}`,
        type: "template",
        template: {
          name: template,
          language: {
            code: "en_US",
          },
          components: components,
        },
      }),
    });

    if (!response) {
      throw new ApiError(
        "An error occurred when sending the otp , please try again",
        500
      );
    }
    const data = response.data;
    return data;
  } catch (error) {
    if (error.response) {
      throw new ApiError(
        error.response.data?.error?.message || "WhatsApp API error",
        error.response.status
      );
    } else {
      throw new ApiError("Network error, please try again later.", 500);
    }
  }
};

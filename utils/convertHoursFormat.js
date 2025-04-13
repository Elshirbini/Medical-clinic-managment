import moment from "moment";

export const convertTo24Hour = (time12h) => {
  return moment(time12h, ["h:mm A", "hh:mm A"]).format("HH:mm");
};

export const convertTo12Hour = (time24h) => {
  return moment(time24h, "HH:mm").format("hh:mm A");
};

import { formatInTimeZone } from "date-fns-tz";

export const JAPAN_TIME_ZONE = "Asia/Tokyo";
export const todayInJapan = () => formatInTimeZone(new Date(), JAPAN_TIME_ZONE, "yyyy-MM-dd");
export const timeInJapan = (seconds: number) => formatInTimeZone(new Date(seconds * 1000), JAPAN_TIME_ZONE, "HH:mm");
export const dateInJapan = (seconds: number) => formatInTimeZone(new Date(seconds * 1000), JAPAN_TIME_ZONE, "M月d日");

import day_js from "dayjs";
import utc from "dayjs/plugin/utc";

day_js.extend(utc);

export const dayjs = day_js;

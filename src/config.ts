export const config = {
  database: {
    path: "./data",
  },
  scheduler: {
    dailyStandup: "0 9 * * 1-5", // 9:00 AM every weekday
    weeklySummary: "0 16 * * 5", // 4:00 PM every Friday
  },
};

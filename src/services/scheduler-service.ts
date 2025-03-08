import { Client, EmbedBuilder, TextChannel } from "discord.js";
import cron from "node-cron";
import { DatabaseService } from "./database-service";
import { config } from "../config";

export class SchedulerService {
  private client: Client;
  private db: DatabaseService;

  constructor(client: Client, db: DatabaseService) {
    this.client = client;
    this.db = db;
  }

  public startSchedulers(): void {
    this.scheduleDailyStandups();
    this.scheduleWeeklySummaries();
  }

  private scheduleDailyStandups(): void {
    // Schedule at 9:00 AM every weekday
    cron.schedule(config.scheduler.dailyStandup, () => {
      const settings = this.db.readSettings();

      Object.entries(settings.channels).forEach(
        ([channelId, channelSettings]) => {
          if (channelSettings.standupEnabled) {
            const channel = this.client.channels.cache.get(
              channelId
            ) as TextChannel;
            if (channel) {
              const standupEmbed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("🌞 Daily Standup")
                .setDescription("What are you working on today?")
                .addFields({
                  name: "How to respond",
                  value: "Reply to this message with your tasks for today",
                })
                .setFooter({
                  text: "Grallix will collect responses for the daily summary",
                });

              channel.send({ embeds: [standupEmbed] }).then((message) => {
                // Set up a collector for responses
                const filter = (m: any) =>
                  m.reference && m.reference.messageId === message.id;
                const collector = channel.createMessageCollector({
                  filter,
                  time: 3600000,
                }); // Collect for 1 hour

                const responses: Array<{
                  userId: string;
                  username: string;
                  content: string;
                  timestamp: number;
                }> = [];

                collector.on("collect", (m) => {
                  responses.push({
                    userId: m.author.id,
                    username: m.author.username,
                    content: m.content,
                    timestamp: m.createdTimestamp,
                  });
                });

                collector.on("end", () => {
                  // Save standup data
                  const standups = this.db.readStandups();
                  standups.standups.push({
                    channelId,
                    date: new Date().toISOString(),
                    responses,
                  });
                  this.db.writeStandups(standups);

                  // Generate summary
                  if (responses.length > 0) {
                    const summaryEmbed = new EmbedBuilder()
                      .setColor("#00cc88")
                      .setTitle("📋 Daily Standup Summary")
                      .setDescription(
                        `Summary for ${new Date().toLocaleDateString()}`
                      );

                    responses.forEach((response) => {
                      summaryEmbed.addFields({
                        name: response.username,
                        value: response.content,
                      });
                    });

                    channel.send({ embeds: [summaryEmbed] });
                  }
                });
              });
            }
          }
        }
      );
    });
  }

  private scheduleWeeklySummaries(): void {
    // Schedule at 4:00 PM every Friday
    cron.schedule(config.scheduler.weeklySummary, () => {
      const settings = this.db.readSettings();
      const tasks = this.db.readTasks();
      const timeLogs = this.db.readTimeLogs();

      Object.entries(settings.channels).forEach(
        ([channelId, channelSettings]) => {
          if (channelSettings.weeklySummaryEnabled) {
            const channel = this.client.channels.cache.get(
              channelId
            ) as TextChannel;
            if (channel) {
              // Filter tasks and time logs for this channel
              const channelTasks = tasks.tasks.filter(
                (task) => task.channelId === channelId
              );
              const channelTimeLogs = timeLogs.logs.filter(
                (log) => log.channelId === channelId
              );

              // Get date range for this week
              const today = new Date();
              const startOfWeek = new Date(
                today.setDate(today.getDate() - today.getDay() + 1)
              );
              startOfWeek.setHours(0, 0, 0, 0);
              const endOfWeek = new Date(
                today.setDate(today.getDate() - today.getDay() + 5)
              );
              endOfWeek.setHours(23, 59, 59, 999);

              // Filter tasks for this week
              const completedTasks = channelTasks.filter(
                (task) =>
                  task.completed &&
                  new Date(task.completedAt as string) >= startOfWeek &&
                  new Date(task.completedAt as string) <= endOfWeek
              );

              const inProgressTasks = channelTasks.filter(
                (task) => !task.completed
              );

              const upcomingTasks = channelTasks.filter(
                (task) =>
                  !task.completed &&
                  new Date(task.dueDate) > endOfWeek &&
                  new Date(task.dueDate) <=
                    new Date(endOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
              );

              // Calculate hours worked
              const hoursWorked: Record<string, number> = {};
              channelTimeLogs.forEach((log) => {
                const logDate = new Date(log.startTime);
                if (logDate >= startOfWeek && logDate <= endOfWeek) {
                  if (!hoursWorked[log.userId]) {
                    hoursWorked[log.userId] = 0;
                  }
                  hoursWorked[log.userId] += log.duration / 3600000; // Convert ms to hours
                }
              });

              // Create summary embed
              const summaryEmbed = new EmbedBuilder()
                .setColor("#9966ff")
                .setTitle("📊 Weekly Progress Summary")
                .setDescription(
                  `Summary for week of ${startOfWeek.toLocaleDateString()} to ${endOfWeek.toLocaleDateString()}`
                );

              // Add completed tasks
              let completedTasksText =
                completedTasks.length > 0
                  ? completedTasks.map((t) => `- ${t.description}`).join("\n")
                  : "None";
              summaryEmbed.addFields({
                name: "✅ Completed Tasks",
                value: completedTasksText,
              });

              // Add in-progress tasks
              let inProgressTasksText =
                inProgressTasks.length > 0
                  ? inProgressTasks
                      .map(
                        (t) =>
                          `- ${t.description} (due: ${new Date(
                            t.dueDate
                          ).toLocaleDateString()})`
                      )
                      .join("\n")
                  : "None";
              summaryEmbed.addFields({
                name: "🔄 In Progress",
                value: inProgressTasksText,
              });

              // Add upcoming tasks
              let upcomingTasksText =
                upcomingTasks.length > 0
                  ? upcomingTasks
                      .map(
                        (t) =>
                          `- ${t.description} (due: ${new Date(
                            t.dueDate
                          ).toLocaleDateString()})`
                      )
                      .join("\n")
                  : "None";
              summaryEmbed.addFields({
                name: "📅 Upcoming Deadlines",
                value: upcomingTasksText,
              });

              // Add hours worked
              let hoursWorkedText =
                Object.keys(hoursWorked).length > 0
                  ? Object.entries(hoursWorked)
                      .map(([userId, hours]) => {
                        const member = channel.guild.members.cache.get(userId);
                        const username = member
                          ? member.user.username
                          : "Unknown User";
                        return `- ${username}: ${hours.toFixed(1)} hours`;
                      })
                      .join("\n")
                  : "No time logged this week";
              summaryEmbed.addFields({
                name: "⏱️ Hours Logged",
                value: hoursWorkedText,
              });

              channel.send({ embeds: [summaryEmbed] });
            }
          }
        }
      );
    });
  }
}

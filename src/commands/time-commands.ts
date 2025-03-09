import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  EmbedBuilder,
} from "discord.js";
import { TimeService } from "../services/time-service";
import { Task } from "../types";

export class TimeCommands {
  private timeService: TimeService;

  constructor(timeService: TimeService) {
    this.timeService = timeService;
  }

  public async handleStartTimer(
    interaction: CommandInteraction
  ): Promise<void> {
    const options = interaction.options as CommandInteractionOptionResolver;
    const taskId = options.getString("taskid", true);

    const result = await this.timeService.startTimer(
      interaction.channelId,
      interaction.user.id,
      taskId
    );

    const taskDescription =
      typeof result.task === "string"
        ? result.task
        : (result.task as Task)?.description || "Unknown Task";

    if (result.success) {
      await interaction.reply({
        content: `⏱️ Timer started for task: ${
          taskDescription || "Unknown Task"
        }`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true,
      });
    }
  }

  public async handleStopTimer(interaction: CommandInteraction): Promise<void> {
    const result = await this.timeService.stopTimer(interaction.user.id);

    if (result.success) {
      const hours = Math.floor((result.duration || 0) / 3600000);
      const minutes = Math.floor(((result.duration || 0) % 3600000) / 60000);
      const seconds = Math.floor(((result.duration || 0) % 60000) / 1000);

      const timeString = `${hours}h ${minutes}m ${seconds}s`;

      await interaction.reply({
        content: `⏱️ Timer stopped for task: ${result.task}\nTime logged: ${timeString}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true,
      });
    }
  }

  public async handleTimeReport(
    interaction: CommandInteraction
  ): Promise<void> {
    const report = await this.timeService.getTimeReport(
      interaction.channelId,
      interaction.user.id
    );

    const embed = new EmbedBuilder()
      .setColor("#33ccff")
      .setTitle("⏱️ Time Report")
      .setDescription(`Time report for ${interaction.user.username}`);

    // Calculate total time
    const totalHours = Math.floor(report.totalTime / 3600000);
    const totalMinutes = Math.floor((report.totalTime % 3600000) / 60000);

    // Add tasks to embed
    const tasks = Object.values(report.taskTimes);
    if (tasks.length > 0) {
      tasks.forEach((task) => {
        const hours = Math.floor(task.totalTime / 3600000);
        const minutes = Math.floor((task.totalTime % 3600000) / 60000);

        embed.addFields({
          name: task.description,
          value: `Time logged: ${hours}h ${minutes}m`,
        });
      });
    } else {
      embed.setDescription(`${interaction.user.username} has no time logged.`);
    }

    // Add total time
    if (report.totalTime > 0) {
      embed.addFields({
        name: "Total Time",
        value: `${totalHours}h ${totalMinutes}m`,
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
}

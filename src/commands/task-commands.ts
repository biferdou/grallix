import { CommandInteraction, EmbedBuilder } from "discord.js";
import { TaskService } from "../services/task-service";

export class TaskCommands {
  private taskService: TaskService;

  constructor(taskService: TaskService) {
    this.taskService = taskService;
  }

  public async handleAddTask(interaction: CommandInteraction): Promise<void> {
    const options = interaction.options;
    const description = options.get("description")?.value as string;
    const dueDateStr = options.get("duedate")?.value as string;

    // Validate due date format
    const dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      await interaction.reply({
        content: "Invalid date format. Please use YYYY-MM-DD.",
        ephemeral: true,
      });
      return;
    }

    const taskId = this.taskService.addTask(
      interaction.channelId,
      interaction.user.id,
      description,
      dueDate.toISOString()
    );

    await interaction.reply({
      content: `✅ Task created! ID: ${taskId}`,
      ephemeral: true,
    });
  }

  public async handleListTasks(interaction: CommandInteraction): Promise<void> {
    const tasks = this.taskService.listTasks(interaction.channelId);

    if (tasks.length === 0) {
      await interaction.reply({
        content: "No active tasks found.",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#ffaa00")
      .setTitle("📋 Active Tasks")
      .setDescription("Here are your active tasks:");

    // Process each task and attempt to get user information
    for (const task of tasks) {
      let username = "Unknown User";

      // Try to get from cache first
      const member = interaction.guild?.members.cache.get(task.userId);

      if (member) {
        username = member.user.username;
      } else if (interaction.guild) {
        // If not in cache, try to fetch the user
        try {
          // We'll attempt to fetch the user information
          const user = await interaction.client.users.fetch(task.userId);
          username = user.username;
        } catch (error) {
          console.error(`Could not fetch user ${task.userId}:`, error);
          // Keep "Unknown User" as fallback
        }
      }

      embed.addFields({
        name: `ID: ${task.id}`,
        value: `**${
          task.description
        }**\nAssigned to: ${username}\nDue: ${new Date(
          task.dueDate
        ).toLocaleDateString()}`,
      });
    }

    await interaction.reply({ embeds: [embed] });
  }

  public async handleCompleteTask(
    interaction: CommandInteraction
  ): Promise<void> {
    const options = interaction.options;
    const taskId = options.get("taskid")?.value as string;
    const result = this.taskService.completeTask(taskId);

    if (result) {
      await interaction.reply({
        content: "✅ Task marked as completed!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌ Task not found. Check the task ID and try again.",
        ephemeral: true,
      });
    }
  }
}

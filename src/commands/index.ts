import {
  ChatInputCommandInteraction,
  Client,
  CommandInteraction,
  CommandInteractionOptionResolver,
} from "discord.js";
import { DatabaseService } from "../services/database-service";
import { TaskService } from "../services/task-service";
import { TimeService } from "../services/time-service";
import { TaskCommands } from "./task-commands";
import { TimeCommands } from "./time-commands";
import { SetupCommands } from "./setup-commands";

export class CommandHandler {
  private client: Client;
  private taskCommands: TaskCommands;
  private timeCommands: TimeCommands;
  private setupCommands: SetupCommands;

  constructor(
    client: Client,
    db: DatabaseService,
    taskService: TaskService,
    timeService: TimeService
  ) {
    this.client = client;
    this.taskCommands = new TaskCommands(taskService);
    this.timeCommands = new TimeCommands(timeService);
    this.setupCommands = new SetupCommands(db);

    this.registerCommands();
  }

  private async registerCommands(): Promise<void> {
    const commands = [
      {
        name: "task",
        description: "Manage tasks",
        options: [
          {
            name: "add",
            type: 1,
            description: "Add a new task",
            options: [
              {
                name: "description",
                type: 3,
                description: "Task description",
                required: true,
              },
              {
                name: "duedate",
                type: 3,
                description: "Due date (YYYY-MM-DD)",
                required: true,
              },
            ],
          },
          {
            name: "list",
            type: 1,
            description: "List all active tasks",
          },
          {
            name: "complete",
            type: 1,
            description: "Mark a task as completed",
            options: [
              {
                name: "taskid",
                type: 3,
                description: "Task ID",
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: "time",
        description: "Track time on tasks",
        options: [
          {
            name: "start",
            type: 1,
            description: "Start tracking time on a task",
            options: [
              {
                name: "taskid",
                type: 3,
                description: "Task ID",
                required: true,
              },
            ],
          },
          {
            name: "stop",
            type: 1,
            description: "Stop tracking time",
          },
          {
            name: "report",
            type: 1,
            description: "Generate a time report",
          },
        ],
      },
      {
        name: "setup",
        description: "Configure Grallix for this channel",
        options: [
          {
            name: "standups",
            type: 5,
            description: "Enable/disable daily standups",
            required: true,
          },
          {
            name: "weekly",
            type: 5,
            description: "Enable/disable weekly summaries",
            required: true,
          },
        ],
      },
    ];

    try {
      console.log("Started refreshing application commands...");
      await this.client.application?.commands.set(commands);
      console.log("Successfully reloaded application commands.");
    } catch (error) {
      console.error(error);
    }
  }

  public async handleInteraction(
    interaction: CommandInteraction
  ): Promise<void> {
    const { commandName, options } = interaction as CommandInteraction & {
      options: CommandInteractionOptionResolver;
    };

    if (commandName === "task") {
      const subcommand = options.getSubcommand();

      if (subcommand === "add") {
        await this.taskCommands.handleAddTask(interaction);
      } else if (subcommand === "list") {
        await this.taskCommands.handleListTasks(interaction);
      } else if (subcommand === "complete") {
        await this.taskCommands.handleCompleteTask(interaction);
      }
    } else if (commandName === "time") {
      const subcommand = options.getSubcommand();

      if (subcommand === "start") {
        await this.timeCommands.handleStartTimer(interaction);
      } else if (subcommand === "stop") {
        await this.timeCommands.handleStopTimer(interaction);
      } else if (subcommand === "report") {
        await this.timeCommands.handleTimeReport(interaction);
      }
    } else if (commandName === "setup") {
      await this.setupCommands.handleSetup(
        interaction as ChatInputCommandInteraction
      );
    }
  }
}

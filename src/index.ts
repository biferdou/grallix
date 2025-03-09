import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  CommandInteraction,
} from "discord.js";
import { config as dotenvConfig } from "dotenv";
import { DatabaseService } from "./services/mongodb-service";
import { TaskService } from "./services/task-service";
import { TimeService } from "./services/time-service";
import { SchedulerService } from "./services/scheduler-service";
import { CommandHandler } from "./commands";

// Load environment variables
dotenvConfig();

// Initialize client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// Initialize services (now async)
const db = new DatabaseService();
const taskService = new TaskService(db);
const timeService = new TimeService(db, taskService);
const schedulerService = new SchedulerService(client, db);
let commandHandler: CommandHandler;

// Event handlers
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}`);

  // Initialize command handler after client is ready
  commandHandler = new CommandHandler(client, db, taskService, timeService);

  // Start schedulers
  schedulerService.startSchedulers();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    await commandHandler.handleInteraction(interaction as CommandInteraction);
  } catch (error) {
    console.error("Error handling command:", error);

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    } catch (e) {
      console.error("Error sending error message:", e);
    }
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

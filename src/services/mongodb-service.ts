import mongoose, { ConnectOptions } from "mongoose";
import { Task, TimeLog, Standup, Settings } from "../types";

// Define Mongoose schemas
const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  channelId: String,
  userId: String,
  description: String,
  dueDate: String,
  createdAt: String,
  completed: Boolean,
  completedAt: String,
});

const TimeLogSchema = new mongoose.Schema({
  userId: String,
  taskId: String,
  channelId: String,
  startTime: String,
  endTime: String,
  duration: Number,
});

const StandupResponseSchema = new mongoose.Schema({
  userId: String,
  username: String,
  content: String,
  timestamp: Number,
});

const StandupSchema = new mongoose.Schema({
  channelId: String,
  date: String,
  responses: [StandupResponseSchema],
});

const ChannelSettingSchema = new mongoose.Schema({
  channelId: { type: String, required: true, unique: true },
  standupEnabled: Boolean,
  weeklySummaryEnabled: Boolean,
});

// Create models
const TaskModel = mongoose.model("Task", TaskSchema);
const TimeLogModel = mongoose.model("TimeLog", TimeLogSchema);
const StandupModel = mongoose.model("Standup", StandupSchema);
const ChannelSettingModel = mongoose.model(
  "ChannelSetting",
  ChannelSettingSchema
);

export class DatabaseService {
  constructor() {
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/grallixbot",
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        } as ConnectOptions
      );
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    }
  }

  // Task operations
  public async readTasks(): Promise<{ tasks: Task[] }> {
    const tasks = await TaskModel.find().lean();
    return { tasks: tasks as Task[] };
  }

  public async writeTasks(data: { tasks: Task[] }): Promise<void> {
    // This is inefficient for MongoDB, but maintaining API compatibility
    await TaskModel.deleteMany({});
    if (data.tasks.length > 0) {
      await TaskModel.insertMany(data.tasks);
    }
  }

  // TimeLog operations
  public async readTimeLogs(): Promise<{ logs: TimeLog[] }> {
    const logs = await TimeLogModel.find().lean();
    return { logs: logs as TimeLog[] };
  }

  public async writeTimeLogs(data: { logs: TimeLog[] }): Promise<void> {
    await TimeLogModel.deleteMany({});
    if (data.logs.length > 0) {
      await TimeLogModel.insertMany(data.logs);
    }
  }

  // Standup operations
  public async readStandups(): Promise<{ standups: Standup[] }> {
    const standups = await StandupModel.find().lean();
    return { standups: standups as Standup[] };
  }

  public async writeStandups(data: { standups: Standup[] }): Promise<void> {
    await StandupModel.deleteMany({});
    if (data.standups.length > 0) {
      await StandupModel.insertMany(data.standups);
    }
  }

  // Settings operations
  public async readSettings(): Promise<Settings> {
    const channelSettings = await ChannelSettingModel.find().lean();

    const settings: Settings = { channels: {} };
    channelSettings.forEach((setting) => {
      settings.channels[setting.channelId] = {
        standupEnabled: setting.standupEnabled ?? false,
        weeklySummaryEnabled: setting.weeklySummaryEnabled ?? false,
      };
    });

    return settings;
  }

  public async writeSettings(data: Settings): Promise<void> {
    // Convert flat settings structure to individual channel settings
    const operations = Object.entries(data.channels).map(
      ([channelId, settings]) => {
        return {
          updateOne: {
            filter: { channelId },
            update: {
              standupEnabled: settings.standupEnabled,
              weeklySummaryEnabled: settings.weeklySummaryEnabled,
            },
            upsert: true,
          },
        };
      }
    );

    if (operations.length > 0) {
      await ChannelSettingModel.bulkWrite(operations);
    }
  }
}

import fs from "fs";
import path from "path";
import { Task, TimeLog, Standup, Settings } from "../types";
import { config } from "../config";

interface TaskData {
  tasks: Task[];
}

interface TimeLogData {
  logs: TimeLog[];
}

interface StandupData {
  standups: Standup[];
}

export class DatabaseService {
  private dbPath: string;
  private tasksFile: string;
  private timeLogsFile: string;
  private standupsFile: string;
  private settingsFile: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), config.database.path);
    this.tasksFile = path.join(this.dbPath, "tasks.json");
    this.timeLogsFile = path.join(this.dbPath, "time_logs.json");
    this.standupsFile = path.join(this.dbPath, "standups.json");
    this.settingsFile = path.join(this.dbPath, "settings.json");

    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }

    this.initDataFile<TaskData>(this.tasksFile, { tasks: [] });
    this.initDataFile<TimeLogData>(this.timeLogsFile, { logs: [] });
    this.initDataFile<StandupData>(this.standupsFile, { standups: [] });
    this.initDataFile<Settings>(this.settingsFile, { channels: {} });
  }

  private initDataFile<T>(filePath: string, defaultData: T): void {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  public readTasks(): TaskData {
    return this.readData<TaskData>(this.tasksFile);
  }

  public writeTasks(data: TaskData): void {
    this.writeData<TaskData>(this.tasksFile, data);
  }

  public readTimeLogs(): TimeLogData {
    return this.readData<TimeLogData>(this.timeLogsFile);
  }

  public writeTimeLogs(data: TimeLogData): void {
    this.writeData<TimeLogData>(this.timeLogsFile, data);
  }

  public readStandups(): StandupData {
    return this.readData<StandupData>(this.standupsFile);
  }

  public writeStandups(data: StandupData): void {
    this.writeData<StandupData>(this.standupsFile, data);
  }

  public readSettings(): Settings {
    return this.readData<Settings>(this.settingsFile);
  }

  public writeSettings(data: Settings): void {
    this.writeData<Settings>(this.settingsFile, data);
  }

  private readData<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  private writeData<T>(filePath: string, data: T): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

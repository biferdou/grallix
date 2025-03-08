import { Collection } from "discord.js";
import { ActiveTimer, Task } from "../types";
import { DatabaseService } from "./database-service";
import { TaskService } from "./task-service";

interface TimerResult {
  success: boolean;
  message: string;
  task?: Task | string;
  duration?: number;
}

interface TimeReport {
  taskTimes: Record<
    string,
    {
      description: string;
      totalTime: number;
    }
  >;
  totalTime: number;
}

export class TimeService {
  private db: DatabaseService;
  private taskService: TaskService;
  private activeTimers: Collection<string, ActiveTimer>;

  constructor(db: DatabaseService, taskService: TaskService) {
    this.db = db;
    this.taskService = taskService;
    this.activeTimers = new Collection();
  }

  public startTimer(
    channelId: string,
    userId: string,
    taskId: string
  ): TimerResult {
    const task = this.taskService.getTask(taskId);

    if (!task) {
      return { success: false, message: "Task not found" };
    }

    if (this.activeTimers.has(userId)) {
      return { success: false, message: "You already have an active timer" };
    }

    this.activeTimers.set(userId, {
      taskId,
      channelId,
      startTime: Date.now(),
      description: task.description,
    });

    return { success: true, message: "Timer started", task };
  }

  public stopTimer(userId: string): TimerResult {
    const timer = this.activeTimers.get(userId);

    if (!timer) {
      return { success: false, message: "No active timer found" };
    }

    const endTime = Date.now();
    const duration = endTime - timer.startTime;

    const timeLogs = this.db.readTimeLogs();
    timeLogs.logs.push({
      userId,
      taskId: timer.taskId,
      channelId: timer.channelId,
      startTime: new Date(timer.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration,
    });

    this.db.writeTimeLogs(timeLogs);
    this.activeTimers.delete(userId);

    return {
      success: true,
      message: "Timer stopped",
      task: timer.description,
      duration,
    };
  }

  public getTimeReport(channelId: string, userId: string): TimeReport {
    const timeLogs = this.db.readTimeLogs();

    // Get logs for this user
    const userLogs = timeLogs.logs.filter(
      (log) => log.channelId === channelId && log.userId === userId
    );

    // Group logs by task
    const taskTimes: Record<
      string,
      { description: string; totalTime: number }
    > = {};

    userLogs.forEach((log) => {
      if (!taskTimes[log.taskId]) {
        const task = this.taskService.getTask(log.taskId);
        taskTimes[log.taskId] = {
          description: task ? task.description : "Unknown Task",
          totalTime: 0,
        };
      }
      taskTimes[log.taskId].totalTime += log.duration;
    });

    // Calculate total time
    const totalTime = Object.values(taskTimes).reduce(
      (sum, task) => sum + task.totalTime,
      0
    );

    return {
      taskTimes,
      totalTime,
    };
  }
}

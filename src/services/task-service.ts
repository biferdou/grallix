import { Task } from "../types";
import { DatabaseService } from "./mongodb-service";

export class TaskService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  public async addTask(
    channelId: string,
    userId: string,
    description: string,
    dueDate: string
  ): Promise<string> {
    const taskId = Date.now().toString();

    const tasks = await this.db.readTasks();

    tasks.tasks.push({
      id: taskId,
      channelId,
      userId,
      description,
      dueDate,
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
    });

    await this.db.writeTasks(tasks);
    return taskId;
  }

  public async listTasks(channelId: string, userId?: string): Promise<Task[]> {
    const tasks = await this.db.readTasks();
    return tasks.tasks.filter(
      (task) =>
        task.channelId === channelId &&
        (userId ? task.userId === userId : true) &&
        !task.completed
    );
  }

  public async completeTask(taskId: string): Promise<boolean> {
    const tasks = await this.db.readTasks();
    const taskIndex = tasks.tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return false;
    }

    tasks.tasks[taskIndex].completed = true;
    tasks.tasks[taskIndex].completedAt = new Date().toISOString();
    await this.db.writeTasks(tasks);
    return true;
  }

  public async getTask(taskId: string): Promise<Task | null> {
    const tasks = await this.db.readTasks();
    return tasks.tasks.find((t) => t.id === taskId) || null;
  }
}

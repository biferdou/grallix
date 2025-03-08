import { Task } from "../types";
import { DatabaseService } from "./database-service";

export class TaskService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  public addTask(
    channelId: string,
    userId: string,
    description: string,
    dueDate: string
  ): string {
    const tasks = this.db.readTasks();
    const taskId = Date.now().toString();

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

    this.db.writeTasks(tasks);
    return taskId;
  }

  public listTasks(channelId: string, userId?: string): Task[] {
    const tasks = this.db.readTasks();
    return tasks.tasks.filter(
      (task) =>
        task.channelId === channelId &&
        (userId ? task.userId === userId : true) &&
        !task.completed
    );
  }

  public completeTask(taskId: string): boolean {
    const tasks = this.db.readTasks();
    const taskIndex = tasks.tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return false;
    }

    tasks.tasks[taskIndex].completed = true;
    tasks.tasks[taskIndex].completedAt = new Date().toISOString();
    this.db.writeTasks(tasks);
    return true;
  }

  public getTask(taskId: string): Task | null {
    const tasks = this.db.readTasks();
    return tasks.tasks.find((t) => t.id === taskId) || null;
  }
}

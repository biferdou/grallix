export interface Task {
  id: string;
  channelId: string;
  userId: string;
  description: string;
  dueDate: string;
  createdAt: string;
  completed: boolean;
  completedAt: string | null;
}

export interface TimeLog {
  userId: string;
  taskId: string;
  channelId: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface StandupResponse {
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

export interface Standup {
  channelId: string;
  date: string;
  responses: StandupResponse[];
}

export interface ChannelSettings {
  standupEnabled: boolean;
  weeklySummaryEnabled: boolean;
}

export interface Settings {
  channels: Record<string, ChannelSettings>;
}

export interface ActiveTimer {
  taskId: string;
  channelId: string;
  startTime: number;
  description: string;
}

# Grallix Discord Bot

A team collaboration Discord bot built with TypeScript. Grallix helps teams manage tasks, track time, organize daily standups, and generate weekly progress reports.

## Features

- **Task Management**: Create, list, and complete tasks with due dates
- **Time Tracking**: Log time spent on specific tasks
- **Daily Standups**: Automated collection of team members' daily updates
- **Weekly Reports**: Summaries of completed tasks and time logged
- **Channel Configuration**: Customize bot features for different channels

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) package manager
- [Discord Bot Token](https://discord.com/developers/applications)

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/ayoubbif/grallix.git
   cd grallix
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Configure environment variables

   ```bash
   cp .env.example .env
   # Edit .env and add your Discord bot token
   ```

4. Build the project

   ```bash
   pnpm build
   ```

5. Start the bot
   ```bash
   pnpm start
   ```

## Development

- Run in development mode with hot reloading:

  ```bash
  pnpm dev
  ```

- Watch for changes and automatically rebuild:
  ```bash
  pnpm watch
  ```

## Commands

### Task Management

- `/task add <description> <duedate>` - Create a new task
- `/task list` - List all active tasks
- `/task complete <taskid>` - Mark a task as completed

### Time Tracking

- `/time start <taskid>` - Start tracking time on a task
- `/time stop` - Stop tracking time
- `/time report` - Generate a time report

### Setup

- `/setup` - Configure Grallix for a channel

## Configuration

Grallix uses a configuration file (`src/config.ts`) to manage settings:

```typescript
export const config = {
  database: {
    path: "./data",
  },
  scheduler: {
    dailyStandup: "0 9 * * 1-5", // 9:00 AM every weekday
    weeklySummary: "0 16 * * 5", // 4:00 PM every Friday
  },
};
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

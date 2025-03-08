import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  GuildTextBasedChannel,
} from "discord.js";
import { DatabaseService } from "../services/database-service";

export class SetupCommands {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  public async handleSetup(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    // Check if user has proper permissions using PermissionFlagsBits
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)
    ) {
      await interaction.reply({
        content:
          '❌ You need the "Manage Channels" permission to configure Grallix.',
        ephemeral: true,
      });
      return;
    }

    const options = interaction.options;
    const enableStandups = options.getBoolean("standups", true);
    const enableWeekly = options.getBoolean("weekly", true);

    const settings = this.db.readSettings();

    if (!settings.channels[interaction.channelId]) {
      settings.channels[interaction.channelId] = {
        standupEnabled: false,
        weeklySummaryEnabled: false,
      };
    }

    settings.channels[interaction.channelId].standupEnabled = enableStandups;
    settings.channels[interaction.channelId].weeklySummaryEnabled =
      enableWeekly;

    this.db.writeSettings(settings);

    const featuresEnabled: string[] = [];
    if (enableStandups) featuresEnabled.push("Daily Standups");
    if (enableWeekly) featuresEnabled.push("Weekly Summaries");

    const featuresDisabled: string[] = [];
    if (!enableStandups) featuresDisabled.push("Daily Standups");
    if (!enableWeekly) featuresDisabled.push("Weekly Summaries");

    // Safely get channel name with proper type checking
    let channelName = "this channel";
    if (interaction.channel && "name" in interaction.channel) {
      channelName = interaction.channel.name ?? "this channel";
    }

    const embed = new EmbedBuilder()
      .setColor("#00cc88")
      .setTitle("⚙️ Grallix Configuration")
      .setDescription(`Configuration updated for channel ${channelName}`);

    if (featuresEnabled.length > 0) {
      embed.addFields({
        name: "✅ Enabled Features",
        value: featuresEnabled.join("\n"),
      });
    }

    if (featuresDisabled.length > 0) {
      embed.addFields({
        name: "❌ Disabled Features",
        value: featuresDisabled.join("\n"),
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
}

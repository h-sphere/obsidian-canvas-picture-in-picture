import InboxOrganisePlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";


export class InboxOrganiseSettingsTab extends PluginSettingTab {
	plugin: InboxOrganisePlugin;

	constructor(app: App, plugin: InboxOrganisePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Inbox Folder')
			.setDesc('Specify the inbox folder')
			.addText((text) =>
				text
					.setPlaceholder('Enter inbox folder')
					.setValue(this.plugin.settings.inboxFolder)
					.onChange(async (value) => {
						this.plugin.settings.inboxFolder = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
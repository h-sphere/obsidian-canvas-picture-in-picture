import { App, FileSystemAdapter, Notice, TAbstractFile, TFolder } from "obsidian";
import { SelectFileModal } from "./modal";
import { DEFAULT_SETTINGS } from "./data";
import { OrganiseCancelError } from "./errors";

export class OrganiseCommand {
    async processInboxFiles() {
		
		const inboxFolder = this.app.vault.getAbstractFileByPath(this.settings.inboxFolder);
		if (!inboxFolder || !inboxFolder.children || inboxFolder.children.length === 0) {
			new Notice("Nothing to Organise",1500)
			return;
		}

		const files = inboxFolder.children.filter((file: TAbstractFile) => file instanceof TAbstractFile);

		for (const file of files) {
			try {
				if (file instanceof TFolder) {
					continue;
				}
				await this.app.workspace.openLinkText(file.path, file.path);
				// await sleep(1000)
				const destination = await this.askForDestinationCustom(file);
				if (destination) {
					await this.moveFile(file, destination.path);
				}

			} catch (e) {
				if (e instanceof OrganiseCancelError) {
					break;
				}
			}
		}
	}

	async askForDestinationCustom(file: TAbstractFile) {
		return new SelectFileModal(this.app, file.name).open();
	}

	async moveFile(file: TAbstractFile, destination: string) {
		const adapter = this.app.vault.adapter as FileSystemAdapter;
		const newPath = `${destination}/${file.name}`;
		await adapter.rename(file.path, newPath);
	}

    constructor(private readonly app: App, private readonly settings: typeof DEFAULT_SETTINGS) {
        this.processInboxFiles()
    }
}
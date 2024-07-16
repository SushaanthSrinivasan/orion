import { browser } from "wxt/browser";
import ExtMessage, { MessageFrom, MessageType } from "@/entrypoints/types.ts";

export default defineBackground(() => {
	console.log("Hello background!", { id: browser.runtime.id });

	// @ts-ignore
	browser.sidePanel
		.setPanelBehavior({ openPanelOnActionClick: true })
		.catch((error: any) => console.error(error));

	// Function to handle extension opening
	const openExtension = async () => {
		console.log("Opening extension");
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (tab && tab.id) {
			browser.tabs.sendMessage(tab.id, {
				messageType: MessageType.clickExtIcon,
			});
		}
	};

	// Monitor the event from extension icon click
	browser.action.onClicked.addListener(openExtension);

	// Existing message listener
	browser.runtime.onMessage.addListener(
		async (
			message: ExtMessage,
			sender,
			sendResponse: (message: any) => void
		) => {
			console.log("background:");
			console.log(message);
			if (message.messageType === MessageType.clickExtIcon) {
				console.log(message);
				return true;
			} else if (
				message.messageType === MessageType.changeTheme ||
				message.messageType === MessageType.changeLocale
			) {
				let tabs = await browser.tabs.query({
					active: true,
					currentWindow: true,
				});
				console.log(`tabs:${tabs.length}`);
				if (tabs) {
					for (const tab of tabs) {
						if (tab.id) {
							await browser.tabs.sendMessage(tab.id, message);
						}
					}
				}
			}
		}
	);
});

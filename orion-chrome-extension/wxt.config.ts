import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: {
		permissions: ["activeTab", "scripting", "sidePanel", "storage", "tabs"],
		action: {},
		name: "__MSG_extName__",
		description: "__MSG_extDescription__",
		default_locale: "en",
		commands: {
			_execute_action: {
				suggested_key: {
					default: "Ctrl+Shift+F",
					mac: "Command+Shift+F",
				},
				description: "Open extension",
			},
		},
	},
	vite: () => ({
		plugins: [react()],
	}),
});

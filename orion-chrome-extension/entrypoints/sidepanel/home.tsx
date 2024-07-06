// HomePage.js
import React, { useState } from "react";
import { Card } from "@/components/ui/card.tsx";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import ReactMarkdown from "react-markdown";

import axios from "axios";
import browser from "webextension-polyfill";

const sendPostRequest = async (url: string, data: any) => {
	console.log("inside sendPostRequest");
	try {
		const response = await axios.post(url, data, {
			withCredentials: false,
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return response.data;
	} catch (error) {
		console.error("Error sending POST request:", error);
		throw error;
	}
};

const getUrl = async () => {
	try {
		const tabs = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (tabs[0] && tabs[0].url) {
			return tabs[0].url;
		}
	} catch (error) {
		console.error("Error getting current tab:", error);
	}
};

export function Home() {
	const [prompt, setPrompt] = useState("");
	const [output, setOutput] = useState("");

	const getUrl = async () => {
		const tabs = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		return tabs[0]?.url || "";
	};

	const handleSubmit = async () => {
		setOutput("Processing...");
		try {
			const formData = new FormData();
			formData.append("prompt", prompt);

			const url = await getUrl();
			formData.append("url", url);

			const data = await sendPostRequest(
				"http://localhost:5000/search",
				formData
			);
			setOutput(data.result.message);
		} catch (err) {
			console.error(err);
			setOutput(`An error occurred: ${(err as Error).message}`);
		}
	};

	return (
		<div>
			<div className="flex w-full max-w-sm items-center space-x-2">
				<div className="grid w-full gap-1.5">
					<h2 className="text-lg font-semibold">Send a message</h2>
					<Textarea
						placeholder="Type your message here."
						id="message-2"
						onChange={(e) => setPrompt(e.target.value)}
					/>
					<p className="text-sm text-muted-foreground">
						Be specific for best results.
					</p>
					<Button onClick={handleSubmit}>Send</Button>
				</div>
			</div>
			<div className="flex w-full max-w-sm items-center space-x-2">
				<div className="grid w-full gap-1.5 pt-4">
					<ReactMarkdown>{output}</ReactMarkdown>
				</div>
			</div>
		</div>
	);
}

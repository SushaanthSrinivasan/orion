// HomePage.js
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card.tsx";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export function Home() {
	const [prompt, setPrompt] = useState("");
	const [output, setOutput] = useState("");
	const [urlUser, setUrlUser] = useState("");
	const [isUrlInputActive, setIsUrlInputActive] = useState(true);

	const getURL = async () => {
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

			const urlTab = await getURL();
			formData.append("urlTab", urlTab);

			formData.append("urlUser", urlUser);

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

	// useEffect(() => {
	// 	const updateCurrentTabURL = async () => {
	// 		const urlTab = await getURL();
	// 		setUrlUser(urlTab);
	// 	};
	// 	updateCurrentTabURL();
	// 	browser.tabs.onActivated.addListener(updateCurrentTabURL);
	// 	return () => {
	// 		browser.tabs.onActivated.removeListener(updateCurrentTabURL);
	// 	};
	// }, []);

	return (
		<div>
			<div className="flex w-full items-center space-x-2">
				<div className="grid w-full gap-1.5">
					<h2 className="text-lg font-semibold">Send a message</h2>
					<Input
						placeholder="Base URL"
						value={urlUser}
						onChange={(e) => setUrlUser(e.target.value)}
					/>
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
			<ScrollArea className="flex w-full items-center space-x-2">
				{/* <div className="grid w-full gap-1.5 pt-4"> */}
				<ReactMarkdown>{output}</ReactMarkdown>
				{/* </div> */}
			</ScrollArea>
		</div>
	);
}

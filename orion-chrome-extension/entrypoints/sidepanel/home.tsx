// HomePage.js
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

import { ExternalLinkIcon } from "@radix-ui/react-icons";

import axios from "axios";
import browser from "webextension-polyfill";

const sendPostRequest = async (url: string, data: any) => {
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

const stripURL = (url: string) => {
	return url.replace(/^(https?:\/\/)?(www\.)?/, "");
};

export function Home() {
	const [prompt, setPrompt] = useState("");
	const [output, setOutput] = useState("");
	const [urlUser, setUrlUser] = useState("");
	const [resURLCards, setResURLCards] = useState(<></>);

	const getURL = async () => {
		const tabs = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		return tabs[0]?.url || "";
	};

	const processURLs = (urls: string[]) => {
		const urlCards = urls.map((url, index) => (
			// <a
			// 	href={url}
			// 	key={index}
			// 	// className="w-1/5 h-10"
			// 	className="w-1/5 h-5 rounded-md"
			// 	target="_blank"
			// 	rel="noopener noreferrer"
			// >
			// 	<Card key={index}>
			// 		<CardHeader className="flex items-center p-2">
			// 			<Badge>{index}</Badge>
			// 			<CardDescription className="text-xs truncate">
			// 				{url}
			// 			</CardDescription>
			// 		</CardHeader>
			// 	</Card>
			// </a>

			<a
				href={url}
				key={index}
				className=""
				target="_blank"
				rel="noopener noreferrer"
			>
				<Card className="pl-2 pr-2 url-card">
					<CardHeader className="flex flex-row items-center p-0 gap-3">
						<Badge className="pt-0 pb-0 pl-1 pr-1">
							<p className="pl-2">{index}</p>
						</Badge>
						<CardDescription className="text-xs truncate flex-grow pb-2 flex flex-row gap-1">
							{stripURL(url)}
							<ExternalLinkIcon className="w-3 h-3 mt-1" />
						</CardDescription>
					</CardHeader>
				</Card>
			</a>
		));

		setResURLCards(<>{urlCards}</>);
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
			processURLs(data.result.resultsURLs);
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
			<ScrollArea className="flex w-full items-center gap-3">
				<ReactMarkdown className="pt-5 pb-5 pl-1">{output}</ReactMarkdown>
				<div className="flex flex-row flex-wrap gap-1">{resURLCards}</div>
			</ScrollArea>
		</div>
	);
}

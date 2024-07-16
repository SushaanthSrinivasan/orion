// HomePage.js
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";

import { ExternalLinkIcon, PaperPlaneIcon } from "@radix-ui/react-icons";

import axios from "axios";
import browser from "webextension-polyfill";

const SERVER_URL = "http://localhost:5000";

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
	const [output, setOutput] = useState(<></>);
	const [urlUser, setUrlUser] = useState("");
	const [resURLCards, setResURLCards] = useState(<></>);
	const [chats, setChats] = useState([]);
	const [textAreaContent, setTextAreaContent] = useState("");
	const [statusMsg, setStatusMsg] = useState("");
	const [userQuery, setUserQuery] = useState(
		"Hi I'm Orion! I can answer any questions regarding any website you visit. How can I help you today?"
	);

	const getURL = async () => {
		const tabs = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		return tabs[0]?.url || "";
	};

	const processURLs = (urls: string[]) => {
		const urlCards = urls.map((url, index) => (
			<a
				href={url}
				key={index}
				className=""
				target="_blank"
				rel="noopener noreferrer"
			>
				<Card className="pl-2 pr-2 url-card">
					<CardHeader className="flex flex-row items-center p-0 gap-1.5">
						<div className="rounded-full aspect-square flex items-center justify-center w-4 h-4 round-badge">
							<p className="">{index}</p>
						</div>
						<CardDescription className="text-xs truncate flex-grow pb-2 flex flex-row gap-1">
							{stripURL(url)}
							<ExternalLinkIcon className="w-3 h-3 mt-1" />
						</CardDescription>
					</CardHeader>
				</Card>
			</a>
		));
		setResURLCards(
			<div className="flex flex-col gap-0.5">
				<p>References:</p>
				<div className="flex flex-row gap-1 flex-wrap">{urlCards}</div>
			</div>
		);
	};

	const handleSubmit = async () => {
		setStatusMsg("Processing...");
		setResURLCards(<></>);
		try {
			const formData = new FormData();

			formData.append("prompt", prompt);

			const urlTab = await getURL();
			formData.append("urlTab", urlTab);
			formData.append("urlUser", urlUser);

			const data = await sendPostRequest(`${SERVER_URL}/search`, formData);

			let tempOutput = (
				<div className="flex flex-row gap-3">
					<Avatar className="w-7 h-7">
						{/* <AvatarImage src="https://github.com/shadcn.png" /> */}
						<AvatarImage src="./assets/orion-avatar.jpg" />
						<AvatarFallback>O</AvatarFallback>
					</Avatar>
					<ReactMarkdown className="pt-1 pb-4 pl-1">
						{data.result.message}
					</ReactMarkdown>
				</div>
			);

			setOutput(tempOutput);
			processURLs(data.result.resultsURLs);
			setTextAreaContent("");
			setStatusMsg("");
			setUserQuery(prompt);
		} catch (err) {
			console.error(err);
			let tempOutput = (
				<div className="flex flex-row gap-3">
					<Avatar className="w-7 h-7">
						{/* <AvatarImage src="https://github.com/shadcn.png" /> */}
						<AvatarImage src="./assets/orion-avatar.jpg" />
						<AvatarFallback>O</AvatarFallback>
					</Avatar>
					<ReactMarkdown className="pt-1 pb-4 pl-1">
						{(err as Error).message}
					</ReactMarkdown>
				</div>
			);
			setOutput(tempOutput);
		}
	};

	const handleTextAreaKeyDown = (e: any) => {
		setPrompt(e.target.value);
		if (e.key === "Enter") {
			if (!e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		}
	};

	const clearChat = () => {
		setOutput(<></>);
		setResURLCards(<></>);
		setUserQuery(
			"Hi I'm Orion! I can answer any questions regarding any website you visit. How can I help you today?"
		);
	};

	return (
		<div>
			<div className="flex w-full items-center space-x-2">
				<div className="flex flex-col w-full h-screen">
					<div className="h-4/6">
						<ScrollArea className="flex w-full items-center gap-3">
							<div className="flex flex-row gap-3">
								<Avatar className="w-7 h-7">
									{/* <AvatarImage src="https://github.com/shadcn.png" /> */}
									<AvatarImage src="/assets/user-avatar.jpg" />
									<AvatarFallback>U</AvatarFallback>
								</Avatar>
								<ReactMarkdown className="pl-1 pt-1 pb-2">
									{userQuery}
								</ReactMarkdown>
							</div>
							<div className="pt-5">{output}</div>
							<div className="flex flex-row flex-wrap gap-1 pl-11">
								{resURLCards}
							</div>
						</ScrollArea>
					</div>
					<div className="h-1/6">
						<div></div>
						<div className="fixed bottom-0 left-0 right-0 p-4">
							<div className="relative">
								<p className="pb-1">{statusMsg}</p>
								<Textarea
									placeholder="Type your message here."
									id="message-2"
									value={textAreaContent}
									onChange={(e) => setTextAreaContent(e.target.value)}
									onKeyDown={handleTextAreaKeyDown}
									className="bottom-10 min-h-[100px] max-h-[300px] overflow-y-auto resize-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
								/>
								<Button
									className="absolute bottom-9 right-11 rounded-full"
									onClick={handleSubmit}
									size="icon"
									variant="ghost"
								>
									<PaperPlaneIcon />
								</Button>
								{/* <div className="flex flex-row">
									<p className="text-sm text-muted-foreground mt-2 ml-1">
										Be specific for best results.
									</p>
									<Button className="right-5 h-5 w-20 rounded-sm">
										Clear Chat
									</Button>
								</div> */}

								<div className="flex items-center space-x-2 pt-3 gap-20">
									<p className="text-sm text-muted-foreground">
										Be specific for best results.
									</p>
									<Button className="h-5 w-20 rounded-sm" onClick={clearChat}>
										<p className="text-sm text-black">Clear Chat</p>
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

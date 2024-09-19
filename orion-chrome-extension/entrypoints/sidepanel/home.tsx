// HomePage.js
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

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

const removeWhitespace = (str: string): string => {
	return str.replace(/\s+/g, "");
};

export function Home() {
	const [prompt, setPrompt] = useState("");
	const [output, setOutput] = useState(<></>);
	const [resURLCards, setResURLCards] = useState(<></>);
	const [chats, setChats] = useState([]);
	const [textAreaContent, setTextAreaContent] = useState("");
	const [statusMsg, setStatusMsg] = useState("");
	const [isCheckedCurrPage, setIsCheckedCurrPage] = useState(false);
	const [isCheckedCurrURL, setIsCheckedCurrURL] = useState(false);
	const [orionBaseOutput, setOrionBaseOutput] = useState(
		"Hi I'm Orion! I can answer any questions regarding any website you visit. How can I help you today?"
	);
	const [userQuery, setUserQuery] = useState("");

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
							<p className="">{index + 1}</p>
						</div>
						<CardDescription className="text-xs truncate flex-grow pb-2 flex flex-row gap-1 max-w-48">
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
		if (removeWhitespace(prompt) === "") {
			return;
		}

		setStatusMsg("Processing...");
		clearChat();
		setResURLCards(<></>);
		setTextAreaContent("");
		setUserQuery(prompt);

		try {
			const formData = new FormData();

			formData.append("prompt", prompt);

			const urlTab = await getURL();
			formData.append("urlTab", urlTab);
			formData.append("isCheckedCurrPage", isCheckedCurrPage.toString());
			formData.append("isCheckedCurrURL", isCheckedCurrURL.toString());

			const data = await sendPostRequest(`${SERVER_URL}/search`, formData);

			let tempOutput = (
				<div className="flex flex-row gap-3">
					<Avatar className="w-7 h-7">
						<AvatarImage src="/orion-avatar.jpg" />
						<AvatarFallback>O</AvatarFallback>
					</Avatar>
					<ReactMarkdown className="pt-1 pb-4 pl-1">
						{data.result.message}
					</ReactMarkdown>
				</div>
			);

			setOutput(tempOutput);
			processURLs(data.result.resultsURLs);
		} catch (err) {
			console.error(err);
			let tempOutput = (
				<div className="flex flex-row gap-3">
					<Avatar className="w-7 h-7">
						<AvatarImage src="/orion-avatar.jpg" />
						<AvatarFallback>O</AvatarFallback>
					</Avatar>
					<ReactMarkdown className="pt-1 pb-4 pl-1">
						{(err as Error).message}
					</ReactMarkdown>
				</div>
			);
			setOutput(tempOutput);
		}
		setStatusMsg("");
	};

	const handleTextAreaKeyDown = (e: any) => {
		setPrompt(e.target.value);
		console.log(prompt);
		if (e.key === "Enter" && removeWhitespace(e.target.value) !== "") {
			if (!e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		}
	};

	const clearChat = () => {
		setOutput(<></>);
		setResURLCards(<></>);
		setUserQuery("");
		setOrionBaseOutput(
			"Hi I'm Orion! I can answer any questions regarding any website you visit. How can I help you today?"
		);
	};

	const handleIsCheckedCurrPage = () => {
		setIsCheckedCurrPage((prevState) => {
			const newState = !prevState;
			console.log(`isCheckedCurrPage: ${newState}`);

			setIsCheckedCurrURL((prevURLState) => {
				if (newState && prevURLState) {
					console.log(`isCheckedCurrURL: false (was: ${prevURLState})`);
					return false;
				}
				console.log(`isCheckedCurrURL: ${prevURLState}`);
				return prevURLState;
			});

			return newState;
		});
	};

	const handleIsCheckedCurrURL = () => {
		setIsCheckedCurrURL((prevState) => {
			const newState = !prevState;
			console.log(`isCheckedCurrURL: ${newState}`);

			setIsCheckedCurrPage((prevPageState) => {
				if (newState && prevPageState) {
					console.log(`isCheckedCurrPage: false (was: ${prevPageState})`);
					return false;
				}
				console.log(`isCheckedCurrPage: ${prevPageState}`);
				return prevPageState;
			});

			return newState;
		});
	};

	return (
		// <div className="flex flex-col gap-1">
		<div>
			<div className="flex w-full items-center space-x-2">
				<div className="flex flex-col w-full h-screen">
					<div className="h-4/6">
						<p className="text-sm inline-flex items-center gap-2">
							<img
								src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg"
								alt="Rotating SVG"
								className="rotating-svg w-5 h-5"
							/>
							Powered by Gemini.
						</p>
						<ScrollArea className="flex w-full items-center gap-3">
							<div className="flex flex-row gap-3">
								<Avatar className="w-7 h-7">
									<AvatarImage src="/orion-avatar.jpg" />
									<AvatarFallback>O</AvatarFallback>
								</Avatar>
								<ReactMarkdown className="pl-1 pt-1 pb-2">
									{orionBaseOutput}
								</ReactMarkdown>
							</div>
							<div className="flex flex-row gap-3">
								{userQuery !== "" ? (
									<Avatar className="w-7 h-7">
										<AvatarImage src="/user-avatar.png" />
										<AvatarFallback>U</AvatarFallback>
									</Avatar>
								) : (
									<></>
								)}
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
						<div className="flex flex-col gap-3">
							<div className="flex flex-row items-center gap-3">
								<p className="text-sm">Search only current webpage</p>
								<Switch
									id="airplane-mode"
									checked={isCheckedCurrPage}
									onCheckedChange={handleIsCheckedCurrPage}
									// className="h-4.5 w-9"
								/>
							</div>
							<div className="flex flex-row items-center gap-3">
								<p className="text-sm">Use current URL as main URL</p>
								<Switch
									id="airplane-mode"
									checked={isCheckedCurrURL}
									onCheckedChange={handleIsCheckedCurrURL}
								/>
							</div>
						</div>

						<div className="fixed bottom-0 left-0 right-0 p-4 mr-12">
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
									className="absolute bottom-9 right-2 rounded-full"
									onClick={handleSubmit}
									size="icon"
									variant="ghost"
								>
									<PaperPlaneIcon />
								</Button>
								<div className="flex items-center space-x-2 pt-3 mr-0.5 justify-between">
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

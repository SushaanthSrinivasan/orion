import axios from "axios";
import cheerio from "cheerio";
import robotsParser from "robots-parser";
import { URL } from "url";
import { convert } from "html-to-text";

const MAX_CONCURRENT_REQUESTS = 5;

let visitedURLs = new Set();
let visitedURLsArray = [];
let scrapedContent = {};

async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeURL(pageURL) {
	const parsedURL = new URL(pageURL);
	parsedURL.hash = "";
	parsedURL.search = "";
	return parsedURL.toString();
}

function clean(input) {
	const regexes = [/\[[^\]]*\]/g];

	let output = input;
	regexes.forEach((regex) => {
		output = output.replace(regex, "");
	});

	output = output.trim();
	return output;
}

async function fetchHTML(pageURL) {
	try {
		const { data } = await axios.get(pageURL);
		const $ = cheerio.load(data);
		return { htmlData: data, $: $ };
	} catch (error) {
		console.error(`Error fetching ${pageURL}:`, error.message);
		return null;
	}
}

async function checkRobotsTxt(baseURL) {
	const robotsTxtURL = new URL("/robots.txt", baseURL).href;
	try {
		const { data } = await axios.get(robotsTxtURL);
		return robotsParser(robotsTxtURL, data);
	} catch (error) {
		return robotsParser(robotsTxtURL, "");
	}
}

// Depth First Search
async function scrapePageDFS(baseURL, startURL, robots, threshold) {
	const stack = [startURL];
	let pagesVisited = 0;

	const { default: pLimit } = await import("p-limit");
	const limit = pLimit(MAX_CONCURRENT_REQUESTS);

	while (stack.length > 0) {
		if (pagesVisited >= threshold) {
			console.log(`Reached the maximum of ${threshold} pages.`);
			break;
		}

		const pageURL = stack.pop();
		const normalizedURL = normalizeURL(pageURL);

		if (visitedURLs.has(normalizedURL)) {
			continue;
		}

		visitedURLs.add(normalizedURL);
		visitedURLsArray.push(normalizedURL);

		// if (robots.isDisallowed(normalizedURL)) {
		// 	console.log(`Skipping disallowed URL: ${normalizedURL}`);
		// 	continue;
		// }

		await limit(async () => {
			try {
				let { htmlData, $ } = await fetchHTML(normalizedURL);
				if (!htmlData || !$) {
					throw new Error(`Failed to fetch or parse HTML for ${normalizedURL}`);
				}

				let pageText = clean(convert(htmlData, { wordwrap: 130 }));

				scrapedContent[normalizedURL] = pageText;

				const links = [];
				$("a").each((i, link) => {
					const href = $(link).attr("href");
					if (href) {
						const absoluteURL = new URL(href, normalizedURL).href;
						if (
							absoluteURL.startsWith(baseURL) &&
							!visitedURLs.has(absoluteURL)
						) {
							links.push(absoluteURL);
						}
					}
				});
				stack.push(...links);
			} catch (err) {
				console.error(`Error scraping ${normalizedURL}:`, err.message);
			}
		});
		pagesVisited++;
	}
}

// Breadth First Search
async function scrapePage(baseURL, startURL, robots, threshold) {
	const queue = [startURL];
	let pagesVisited = 0;

	const { default: pLimit } = await import("p-limit");
	const limit = pLimit(MAX_CONCURRENT_REQUESTS);

	while (queue.length > 0) {
		if (pagesVisited >= threshold) {
			console.log(`Reached the maximum of ${threshold} pages.`);
			break;
		}

		const pageURL = queue.shift();
		const normalizedURL = normalizeURL(pageURL);

		if (visitedURLs.has(normalizedURL)) {
			continue;
		}

		visitedURLs.add(normalizedURL);
		visitedURLsArray.push(normalizedURL);

		await limit(async () => {
			try {
				let { htmlData, $ } = await fetchHTML(normalizedURL);
				if (!htmlData || !$) {
					throw new Error(`Failed to fetch or parse HTML for ${normalizedURL}`);
				}

				let pageText = clean(convert(htmlData, { wordwrap: 130 }));

				scrapedContent[normalizedURL] = pageText;

				const links = [];
				$("a").each((i, link) => {
					const href = $(link).attr("href");
					if (href) {
						const absoluteURL = new URL(href, normalizedURL).href;
						if (
							absoluteURL.startsWith(baseURL) &&
							!visitedURLs.has(absoluteURL)
						) {
							links.push(absoluteURL);
						}
					}
				});
				queue.push(...links);
			} catch (err) {
				console.error(`Error scraping ${normalizedURL}:`, err.message);
			}
		});
		pagesVisited++;
	}
}

export async function scrapeWebpages(baseURL, threshold, flush) {
	if (flush) {
		visitedURLs.clear();
		visitedURLsArray.length = 0;
		scrapedContent = {};
	}

	const robots = await checkRobotsTxt(baseURL);
	await scrapePage(baseURL, baseURL, robots, threshold);

	return { scrapedContent, visitedURLsArray };
}

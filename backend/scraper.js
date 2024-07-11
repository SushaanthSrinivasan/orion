const axios = require("axios");
const cheerio = require("cheerio");
const robotsParser = require("robots-parser");
const url = require("url");
const { convert } = require("html-to-text");

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

	output = input;
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
		// console.log(data);
		// return cheerio.load(data);
		return { htmlData: data, $: $ };
	} catch (error) {
		console.error(`Error fetching ${pageURL}:`, error.message);
		return null;
	}
}

async function checkRobotsTxt(baseURL) {
	const robotsTxtURL = url.resolve(baseURL, "/robots.txt");
	try {
		const { data } = await axios.get(robotsTxtURL);
		return robotsParser(robotsTxtURL, data);
	} catch (error) {
		// If fetching robots.txt fails, assume no restrictions
		return robotsParser(robotsTxtURL, "");
	}
}

async function scrapePage(baseURL, startURL, robots, threshold) {
	const stack = [startURL];
	let pagesVisited = 0;

	const { default: pLimit } = await import("p-limit");
	const limit = pLimit(MAX_CONCURRENT_REQUESTS);

	while (stack.length > 0) {
		// Stop if the threshold number of pages is reached
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

		// Use limit to control concurrency
		await limit(async () => {
			// const $ = await fetchHTML(normalizedURL);
			// if (!$) return;

			let { htmlData, $ } = await fetchHTML(normalizedURL);
			let pageText = clean(convert(htmlData, { wordwrap: 130 }));

			console.log(pageText);
			// console.log(normalizedURL);

			// const pageText = $("html").text().trim();
			scrapedContent[normalizedURL] = pageText;

			console.log(pageText);

			const links = [];
			$("a").each((i, link) => {
				const href = $(link).attr("href");
				if (href) {
					const absoluteURL = url.resolve(normalizedURL, href);
					if (
						absoluteURL.startsWith(baseURL) &&
						!visitedURLs.has(absoluteURL)
					) {
						links.push(absoluteURL);
					}
				}
			});
			stack.push(...links);
		});

		pagesVisited++;
	}
}

async function scrapeWebpages(baseURL, threshold, flush) {
	if (flush) {
		visitedURLs.clear();
		visitedURLsArray.length = 0;
		scrapedContent = {};
	}

	const robots = await checkRobotsTxt(baseURL);
	await scrapePage(baseURL, baseURL, robots, threshold);

	// Return the scraped content and visited URLs array
	return { scrapedContent, visitedURLsArray };
}

module.exports = {
	scrapeWebpages,
};

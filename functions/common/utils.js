const functions = require("firebase-functions");
const admin = require("firebase-admin");
const puppeteer = require("puppeteer");

/**
 * Main method for fetching text content.
 * Checks/saves to storage before using browser scraper
 * @param {post} post the post in question.
 */
const getTextContentForPost = async function(post) {
  if (!post.url) return;

  let content = await getTextContentFromStorage(post);
  if (content) return content;

  content = await getTextContentFromBrowser(post.url);
  if (content) {
    setTextContentInStorage(post, content);
    return content;
  } else {
    functions.logger.error(
        `Could not fetch content for url: ${post.url}, content: ${content}`);
    return;
  }
};

/**
 * Creates/overwrites the content in storage from browser scrape.
 * @param {post} post the post in question.
 */
const setTextContentFromBrowser = async function(post) {
  const content = await getTextContentFromBrowser(post.url);
  if (content) {
    setTextContentInStorage(post, content);
    return content;
  } else {
    functions.logger.error(
        `Could not fetch content for url: ${post.url}, content: ${content}`);
    return;
  }
};

/**
 * Method from scraping webpage text content with headless browswer
 * @param {string} url in the post in question.
 */
const getTextContentFromBrowser = async function(url) {
  const browser = await puppeteer.launch({headless: "new"});

  const page = (await browser.pages())[0];
  await page.goto(url);
  const extractedText = await page.$eval("*", (el) => {
    // eslint-disable-next-line no-undef
    const selection = window.getSelection();
    // eslint-disable-next-line no-undef
    const range = document.createRange();
    range.selectNode(el);
    selection.removeAllRanges();
    selection.addRange(range);
    // eslint-disable-next-line no-undef
    return window.getSelection().toString();
  });
  // do we need to await here?
  await browser.close();
  return extractedText;
};

/**
 * Method from scraping webpage text content with headless browswer
 * @param {string} url in the post in question.
 * @return {string} with title
 * @return {string} with creator
 * @return {string?} with imageUrl
 */
const getTextContentFromX = async function(url) {
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();

  // Use the provided sample X URL
  await page.goto(url, {waitUntil: "networkidle2"});

  // Finds the tweet text
  // Hack, to be solved with twitter API
  const tweetTextSelector = "article [data-testid=\"tweetText\"]";

  // Finds the account handle
  // Hack, to be solved with twitter API
  // in this case needs a div, span at the end. Not sure why.
  const tweetAuthorSelector =
  "article [data-testid=\"User-Name\"] div:nth-of-type(2) div span";

  // Selector for the image within the tweet, based on your structure
  const tweetImageSelector = "[data-testid='tweetPhoto'] img";


  // this gets the users display name
  // const tweetProfileSelector
  // = "article [data-testid=\"User-Name\"] div span";


  // Extract tweet text and author using the selectors
  const tweetText = await page.evaluate((selector) => {
    // eslint-disable-next-line no-undef
    const element = document.querySelector(selector);
    return element ? element.innerText : null;
  }, tweetTextSelector);

  const tweetAuthor = await page.evaluate((selector) => {
    // eslint-disable-next-line no-undef
    const element = document.querySelector(selector);
    return element && element.innerText && element.innerText[0] == "@" ?
    element.innerText : null;
  }, tweetAuthorSelector);

  // Extract the 'src' attribute of the image
  const tweetImageUrl = await page.evaluate((selector) => {
    // eslint-disable-next-line no-undef
    const element = document.querySelector(selector);
    return element ? element.src : null;
  }, tweetImageSelector);

  // do we need to await here
  await browser.close();

  return {
    title: tweetText,
    creator: tweetAuthor,
    imageUrl: tweetImageUrl,
  };
};

// ////////////////////////////
// Storage APIs (could be moved)
// ////////////////////////////

/**
  * @param {post} post in question
  * @param {String} content is the text to be saved
  */
const setTextContentInStorage = async function(post, content) {
  const file = admin.storage().bucket().file(`posts/text/${post.pid}.txt`);
  await file.save(content, {
    contentType: "text/plain",
    gzip: true,
  });
};

/**
  * @param {post} post
  * @return {String | null} content text from or null if unavailable
  */
const getTextContentFromStorage = async function(post) {
  console.log(`posts/text/${post.pid}.txt`);
  const file = admin.storage().bucket().file(`posts/text/${post.pid}.txt`);
  const exists = await file.exists();
  if (!exists[0]) return;
  const text = await file.download().then((data) => {
    return data[0].toString();
  });
  return text;
};

const isPerfectSquare = function(x) {
  const s = Math.sqrt(x);
  return s * s === x;
};

const isFibonacciNumber = function(n) {
  if (!n) return false;
  return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4);
};

/**
 * Calculate the probability of player A winning
 * @param {number} eloA - the Elo rating of player A
 * @param {number} eloB - the Elo rating of player B
 * @return {number} the probability of player A winning
 */
function calculateProbability(eloA, eloB) {
  return 1.0 / (1.0 + Math.pow(10, (eloB - eloA) / 400));
}

/**
 * @param {number} eloWinner - the Elo rating of player A
 * @param {number} eloLoser - the Elo rating of player B
 * @param {boolean} didWin - the result of the match for player A, 1, 0 or 0.5
 * @param {number} kFactor - the K-factor for the match
 * @return {number} new rating
 */
function getElo(eloWinner, eloLoser, didWin, kFactor = 32) {
  // Calculate the probability of winning for each player
  const probA = calculateProbability(eloWinner, eloLoser);
  // const probB = calculateProbability(eloLoser, eloWinner);

  // Update ratings
  const newRatingWinner = eloWinner + kFactor * (didWin - probA);
  // const newRatingLoser = eloLoser + kFactor * ((1 - winner) - probB);
  // convert number to integer
  return Math.round(newRatingWinner);
}

/**
 * @param {string} url - the URL to parse
 * @return {string} the domain of the URL
 */
function urlToDomain(url) {
  if (!url) return;
  const domain = (new URL(url)).hostname;
  return domain;
}


module.exports = {
  getTextContentForPost,
  getTextContentFromStorage,
  getTextContentFromBrowser,
  setTextContentFromBrowser,
  setTextContentInStorage,
  urlToDomain,
  isFibonacciNumber,
  isPerfectSquare,
  getElo,
  getTextContentFromX,
};
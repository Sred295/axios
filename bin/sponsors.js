import fs from "fs/promises";
import _axios from '../index.js';
import {exec} from "./repo.js";
import {colorize} from "./helpers/colorize.js";

const axios = _axios.create({
  headers: {
    "User-Agent": 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  }
});

const getWithRetry = (url, retries = 3) => {
  let counter = 0;
  const doRequest = async () => {
    try {
      return await axios.get(url);
    } catch (err) {
      if (counter++ >= retries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, counter ** counter * 1000));
      return doRequest();
    }
  };
  return doRequest();
};

const sanitizeSponsors = (rawContent) => {
  const allowedPatterns = [
    "github.com/sponsors/axios",
    "opencollective.com/axios"
  ];

  return rawContent
    .split("\n")
    .filter(line => allowedPatterns.some(p => line.includes(p)))
    .join("\n");
};

const updateReadmeSponsors = async (url, path, marker = '<!--<div>marker</div>-->') => {
  let fileContent = (await fs.readFile(path)).toString();
  const index = fileContent.indexOf(marker);

  if (index >= 0) {
    const readmeContent = fileContent.slice(index);

    let { data: sponsorContent } = await getWithRetry(url);

    sponsorContent = sanitizeSponsors(sponsorContent) + '\n';

    const currentSponsorContent = fileContent.slice(0, index);

    if (currentSponsorContent !== sponsorContent) {
      console.log(colorize()`Sponsor block in [${path}] updated (spam removed / whitelist applied)`);
      await fs.writeFile(path, sponsorContent + readmeContent);
      return sponsorContent;
    } else {
      console.log(colorize()`Sponsor block in [${path}] is already clean`);
    }
  } else {
    console.warn(colorize()`Cannot find marker (${marker}) in ${path} to inject sponsor block`);
  }

  return false;
};


(async (url) => {
  const newContent = await updateReadmeSponsors(url, './README.md');

  await exec(`echo "changed=${newContent ? 'true' : 'false'}" >> $GITHUB_OUTPUT`);
  if (newContent !== false) {
    await fs.mkdir('./temp').catch(() => {});
    await fs.writeFile('./temp/sponsors.md', newContent);
  }
})('https://axios-http.com/data/sponsors.md');

import fs from 'node:fs';
import axios from 'axios';
import { printSuccessMessage, printErrorMessage } from './utils.js';

const mainProcess = async () => {
  try {
    const npmData = await axios.get('https://registry.npmjs.org/axios');
    const npmVersionArray = Object.keys(npmData.data.time);

    const configFileContents = fs.readFileSync(
      './.vitepress/config.mts',
      'utf8',
    );

    const updatedConfigFileContents = configFileContents.replace(
      npmVersionArray.at(-2),
      npmData.data['dist-tags'].latest,
    );

    fs.writeFileSync(
      './.vitepress/config.mts',
      updatedConfigFileContents,
      'utf8',
    );
    printSuccessMessage('updated version number!');
  } catch {
    printErrorMessage('failed to update version number!');
  }
};

await mainProcess();

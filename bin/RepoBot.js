import GithubAPI from "./GithubAPI.js";
import api from './api.js';
import Handlebars from "handlebars";
import fs from "fs/promises";
import {colorize} from "./helpers/colorize.js";
import {getReleaseInfo} from "./contributors.js";
import path from "path";
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NOTIFY_PR_TEMPLATE = path.resolve(__dirname, '../templates/pr_published.hbs');

const normalizeTag = (tag) => tag ? 'v' + tag.replace(/^v/, '') : '';

const GITHUB_BOT_LOGIN = 'github-actions[bot]';

const skipCollaboratorPRs = true;

class RepoBot {
  constructor(options) {
    const {
      owner, repo,
      templates
    } = options || {};

    this.templates = {
      published: NOTIFY_PR_TEMPLATE,
      ...templates
    };

    this.github = api || new GithubAPI(owner, repo);

    this.owner = this.github.owner;
    this.repo = this.github.repo;
  }

  async addComment(targetId, message) {
    return this.github.createComment(targetId, message);
  }

  async _getPR(id) {
    try {
      return await this.github.getPR(id);
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error(`PR #${id} not found (404)`);
      }
      console.warn(colorize('red')`Failed to fetch PR #${id}: ${err.message}`);
      throw err;
    }
  }

  _hasBeenNotified(comments) {
    return comments.some(
      ({body, user}) => user.login === GITHUB_BOT_LOGIN && body.includes('published in')
    );
  }

  async notifyPRPublished(id, tag) {
    const pr = await this._getPR(id);

    tag = normalizeTag(tag);

    const {merged, labels, user: {login, type}} = pr;

    if (!merged) {
      console.log(colorize('yellow')`Skipping PR #${id}: not merged.`);
      return false;
    }

    // Apply the release tag label regardless of notification status
    await this.github.appendLabels(id, [tag]);

    const isBot = type === 'Bot';

    if (!merged) {
      console.log(colorize('yellow')`Skipping PR #${id}: not merged.`);
      return false
    }

    if (isBot || labels.find(({name}) => name === 'automated pr') || (skipCollaboratorPRs && await this.github.isCollaborator(login))) {
      console.log(colorize('yellow')`Skipping notification for PR #${id}: automated or collaborator PR.`);
      return false;
    }

    const comments = await this.github.getComments(id, {desc: true});

    if (this._hasBeenNotified(comments)) {
      const commentUrl = comments.find(({user}) => user.login === GITHUB_BOT_LOGIN)?.html_url;
      console.log(colorize()`Release comment already exists for PR #${id}. ${commentUrl || ''}`);
      return false;
    }

    const author = await this.github.getUser(login);

    author.isBot = isBot;

    const message = await this.constructor.renderTemplate(this.templates.published, {
      id,
      author,
      release: {
        tag,
        url: `https://github.com/${this.owner}/${this.repo}/releases/tag/${tag}`
      }
    });

    return await this.addComment(id, message);
  }

  async notifyPublishedPRs(tag) {
    tag = normalizeTag(tag);

    const release = await getReleaseInfo(tag);

    if (!release) {
      throw Error(colorize()`Can't get release info for ${tag}`);
    }

    const {merges} = release;

    console.log(colorize()`Found ${merges.length} PRs in ${tag}:`);

    let i = 0;

    for (const pr of merges) {
      try {
        console.log(colorize()`${++i}) Notifying PR #${pr.id}...`);
        const result = await this.notifyPRPublished(pr.id, tag);
        console.log('✔️', result ? 'Label, comment' : 'Label');
      } catch (err) {
        console.warn(colorize('green', 'red')`❌ Failed notify PR ${pr.id}: ${err.message}`);
      }
    }
  }

  static async renderTemplate(template, data) {
    return Handlebars.compile(String(await fs.readFile(template)))(data);
  }
}

export default RepoBot;

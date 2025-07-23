# Contributing

## Introduction

Welcome to the Contributing Guide for `axios`! We appreciate your interest in contributing to our project. This guide will help you understand how to contribute effectively and efficiently.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

As for everything else in the project, the contributions to Hoodie are governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## How to help

Axios is an open-source project, and we welcome contributions from everyone. Here are some ways you can contribute:

- **Reporting Bugs**: If you find a bug in the code, please report it by creating an issue. Make sure to provide as much detail as possible, including steps to reproduce the issue and any relevant error messages.
- **Feature Requests**: If you have an idea for a new feature or improvement, please create an issue to discuss it. We welcome suggestions and feedback from the community.
- **Submitting Pull Requests**: If you want to contribute code, please fork the repository and create a new branch for your changes. Make sure to write clear commit messages and include tests for your changes. Once you're ready, submit a pull request for review.
- **Documentation**: If you notice any gaps or errors in the documentation, please submit a pull request to improve it. Clear and accurate documentation is essential for helping others understand and use the project effectively.
- **Testing**: Help us by testing the code and reporting any issues you find. This is especially important for new features or changes to existing functionality.
- **Community Support**: Join our community forums or chat channels to help others with their questions and issues. Your experience and knowledge can be invaluable to others.
- **Spread the Word**: Share your experiences with Axios on social media, blogs, or other platforms. The more people know about Axios, the more contributors we can attract to the project.
- **Translations**: Help us translate the documentation and other resources into different languages. This will make it easier for non-English speakers to use and contribute to the project.
- **Design**: If you have design skills, you can help improve the project's branding, website, or other visual elements. Good design can make a big difference in how users perceive and interact with the project.
- **Code Quality**: Help us maintain high code quality by reviewing pull requests, suggesting improvements, and reporting any issues you find. This includes checking for code style, performance, and security issues.
- **Participate in Discussions**: Join discussions on GitHub issues, pull requests, and community forums. Your input can help shape the direction of the project and improve collaboration among contributors.

## Ground Rules

- **Respect**: Treat everyone with respect and kindness. We are all here to learn and grow together.
- **Constructive Feedback**: Provide constructive feedback on pull requests and issues. Focus on the code and the problem, not the person.
- **Be Open-Minded**: Be open to different perspectives and ideas. Collaboration is key to a successful open-source project.
- **Stay On Topic**: Keep discussions focused on the project and its goals. Off-topic discussions can be moved to other channels or forums.
- **Be Patient**: Understand that maintainers and contributors may have other commitments. It may take time for them to respond to issues and pull requests.
- **Follow the Code of Conduct**: Adhere to the project's [Code of Conduct](CODE_OF_CONDUCT.md) at all times. This helps create a welcoming and inclusive environment for everyone.
- **Use Clear Language**: When communicating, use clear and concise language. Avoid jargon or technical terms that may not be familiar to everyone.
- **Be Specific**: When reporting bugs or requesting features, provide as much detail as possible. This helps maintainers understand the issue and prioritize it effectively.
- **Test Your Changes**: Before submitting a pull request, make sure to test your changes thoroughly. This helps ensure that your code works as intended and doesn't introduce new issues.
- **Follow the Project's Guidelines**: Familiarize yourself with the project's guidelines and best practices. This includes coding standards, commit message formats, and testing requirements.

## Your First Contribution

If you are new to open source, we recommend checking out [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/) for a great introduction.

This guide provides an overview of the open source ecosystem, how to find projects to contribute to, and tips for making your first contribution. It also includes information on how to communicate effectively with project maintainers and other contributors.

This guide will help you understand the process of contributing to open source projects and provide tips for making your first contribution.

## Using our templates

We have created templates for issues and pull requests to help you provide the necessary information. When creating a new issue or pull request, please use the appropriate template. This will help us understand your request and respond more quickly.

Please try to apply the appropriate labels to your issue or pull request. This will help us categorize and prioritize your request.

If you are unsure which labels to use, please leave it to the maintainers. We will apply the appropriate labels based on the content of your issue or pull request.

## Code Style

Our repo uses [XO](https://github.com/xojs/xo) for linting. Should you want to you may install the extension for linting which is available for most popular code editors. Please make sure to run the linter before submitting your code. You can do this by running the following command:

```bash
npm run lint
```

This will check your code for any linting errors and provide suggestions for fixing them. If you have any questions about the linter or how to fix errors, please ask in the community forums or chat channels.

## Testing

We have a comprehensive test suite to ensure the quality and reliability of our code. Before submitting a pull request, please run the tests to make sure everything is working as expected. You can do this by running the following command:

```bash
npm test
```

This will run all the tests in the project and report any failures. If you encounter any issues, please investigate and fix them before submitting your pull request.

If you are adding new features or making significant changes, please consider adding tests to cover your changes. This will help ensure that your code is thoroughly tested and will prevent regressions in the future.

If you are unsure how to write tests or need help with the testing framework, please ask in the community forums or chat channels. We are happy to help you get started with testing.

## Compiled files

Please do not include compiled files in your pull requests. We use a build process to generate the compiled files, and they are automatically generated during the release process.

Including compiled files in your pull requests can lead to merge conflicts and make it difficult to track changes in the source code.

## Documentation

We strive to keep our documentation up to date and accurate. If you notice any errors or gaps in the documentation, please submit a pull request to improve it. This includes updating code examples, fixing typos, and adding new sections as needed.

The documentation is located in the `docs` directory. Please make sure to follow the project's guidelines for writing documentation, including formatting and style.

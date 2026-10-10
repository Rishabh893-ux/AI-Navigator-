# AI Navigator

![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)
![HTML, CSS, JS](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-blue.svg)
![No build step](https://img.shields.io/badge/build-none-lightgrey.svg)

A free, structured AI learning hub for students. It's one HTML file: no install, no build step and no server.

## Features

- **Dashboard:** your progress, learning streak, popular AI tools and suggested next steps.
- **Roadmap:** step-by-step learning paths for Beginner, Intermediate and Advanced levels, with free resources.
- **Topic explainer:** plain-language explanations of ML, LLMs, neural networks, RAG, prompt engineering, fine-tuning and AI bias. You can search them or filter by focus area.
- **Progress tracker:** a 10-topic checklist that saves in your browser.
- **AI Mentor:** a chat assistant powered by Google Gemini (`gemini-3.8-flash`). It knows your level and finished topics, remembers the conversation, formats its answers (lists, bold, links), retries automatically when Gemini is busy, and gives up after 60 seconds instead of hanging.
- **AI updates:** important changes for students, plus trusted news sources.
- **Dark mode**, a phone-friendly layout, and keyboard navigation.

## Project structure

```
AI-Navigator-/
├── ai-navigator.html   # The whole app: HTML, CSS and JavaScript
├── README.md           # This file
├── LICENSE             # MIT License
└── .gitignore          # Keeps secrets, OS and editor files out of Git
```

## Getting started

1. Download or clone this repository.
2. Open `ai-navigator.html` in any modern browser.

That's it. Everything except the AI Mentor works offline.

## Turning on the AI Mentor

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey), sign in, and click **Create API key**. It's free.
2. In the app, open the **AI Mentor** tab.
3. Paste the key into the yellow box and click **Save key**.

The key is stored **only in your browser** (`localStorage`). It is never written into the file, so it can't leak through GitHub.

> **Never commit an API key to this repository.** Anything in a public repo, or in a web page, can be read by anyone.

## Your data and privacy

All your data stays in your browser's `localStorage`:

| Key | What it holds |
|---|---|
| `ain_progress` | Checklist progress |
| `ain_streak` | Learning streak |
| `ain_level` | Chosen level |
| `ain_theme` | Light or dark mode |
| `ain_chat` | AI Mentor conversation (last 40 messages) |
| `ain_gemini_key` | Your Gemini API key |
| `ain_updates_seen` | Whether you've read the latest updates |

Mentor messages are sent to Google's Gemini API, together with your level and finished topics. Nothing else leaves your device. To reset everything, clear this site's data in your browser settings.

## Updating content

- **Model:** change `GEMINI_MODEL` near the top of the `<script>` block.
- **AI updates tab:** edit the `panel-weekly` section, then bump `UPDATES_VERSION` in the script so the "new" badge shows again for returning users.

## Troubleshooting

| Message in the chat | What to do |
|---|---|
| "API key not set" | Paste your key in the yellow box and click **Save key**. |
| "API key not valid" | Create a new key in Google AI Studio and save it again. |
| "high demand" / "Gemini is busy" | Wait a minute and try again. The app already retries 3 times. |
| "took too long to answer" | Gemini is slow right now. Send the message again. |

## Tech

Plain HTML, CSS and JavaScript in a single file, with no dependencies apart from the Inter font from Google Fonts.

## Contributing

Suggestions and fixes are welcome. Open an issue or a pull request. Please don't commit API keys or other secrets; `.gitignore` already excludes `.env` files.

## License

Released under the [MIT License](LICENSE). You're free to use, copy, change and share this project, as long as you keep the copyright notice.

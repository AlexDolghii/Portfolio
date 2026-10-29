# Alex Dolghii's Portfolio

## What it is

My personal portfolio site, aimed at recruiters for security co-op and student roles and at classmates. It covers my work as a Junior Cybersecurity Analyst at Go2Cloud and my other roles, four projects (an Active Directory lab built as code, an Azure AI agent, a cloud ordering platform, and my home lab), my skills grouped by area, my education, and how to reach me.

## Live site

[View my portfolio](https://alex-dolghii.web.app)

## How it was built

- **Planning:** I used `SPEC.md` to decide the content and sections of the site: Home, About, Experience, Projects, Skills, Education and Contact. Everything on the page comes from that file.
- **Website:** Plain HTML, CSS and JavaScript in the `public/` folder, no frameworks and no build step. The script adds a few small interactions: a Copy email button, nav highlighting for the section you're reading, a clickable `whoami` that replays the intro, a note in the browser console, and a tab title that changes while you're on another tab. There's also a terminal-style 404 page and a share card for link previews.
- **Security:** Strict security headers (Content Security Policy, frame blocking, no referrer, locked-down browser permissions) are set in `firebase.json`, and the site publishes a [`security.txt`](https://alex-dolghii.web.app/.well-known/security.txt) with a contact for reporting vulnerabilities.
- **Scores (live site, Oct 29 2026):** [Mozilla HTTP Observatory](https://developer.mozilla.org/en-US/observatory/analyze?host=alex-dolghii.web.app) **A+** (145/100, 12 of 12 tests passed). Lighthouse (mobile): Performance 99, Accessibility 100, Best Practices 100, SEO 100.
- **Design:** I chose the `vibe-terminal` skill, with the feel "technical, dense, a bit playful". I compared three terminal mockups and picked the parts I wanted: a terminal window frame, prompt-style headings and bordered project cards, skills as #tags, and contact as one label and link per line. Those preferences are written in section 8 of `AGENTS.md`.
- **AI tools:** I used Claude (Claude Code) as the coding agent. It built the site from `SPEC.md` and the rules in `AGENTS.md`, then the result was reviewed for invented content, rule breaks, contrast and mobile layout. I checked the facts in the spec and chose the vibe and layout.
- **Version control and hosting:** Git and GitHub track every change. The site is deployed with Firebase Hosting, on a custom site name I set up so the link is `alex-dolghii.web.app` instead of the default project ID.

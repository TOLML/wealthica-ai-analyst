# wealthica-ai-analystWealthica AI Portfolio Analyst
An AI-powered add-on for Wealthica that analyzes your investment portfolio using Claude (Anthropic's AI). Get plain-English insights on concentration risk, tax optimization, rebalancing suggestions, and more.
Features

Full Portfolio Analysis — Overview, risk assessment, and actionable suggestions
Concentration & Risk — Flags single-stock risk, sector tilts, correlation exposure
Tax Optimization — Canadian-specific advice on RRSP/TFSA/non-reg placement
Rebalancing Suggestions — Specific trades to improve your allocation
Income & Dividends — Projected dividend income and yield analysis
Custom Questions — Ask anything about your portfolio
Streaming Responses — Real-time AI output as it generates
Multi-Account Support — Analyzes across all your connected institutions

Setup Instructions
Step 1: Host the Add-on
The add-on is a single HTML file that needs to be hosted somewhere accessible via HTTPS. The easiest free option is GitHub Pages:

Create a new GitHub repository (e.g., wealthica-ai-analyst)
Upload index.html to the repository
Go to Settings → Pages → Source and select "Deploy from a branch" (main branch, root folder)
Your add-on will be available at: https://YOUR_USERNAME.github.io/wealthica-ai-analyst/index.html

Step 2: Install in Wealthica

Log in to Wealthica
Go to Add-ons and install the Developer Add-on
Click the Configure button (gear icon) next to the Developer Add-on title
Paste your hosted URL into the Add-on URL field
Click Load

Step 3: Set Your API Key

In the add-on, click the API Key button in the top-right
Enter your Anthropic API key (get one from console.anthropic.com)
Click Save — the key is stored in your Wealthica preferences (persists across sessions)

Step 4: Analyze

Select an analysis type from the dropdown (or choose "Custom Question")
Click Analyze
Claude will stream its analysis in real-time

How It Works
┌─────────────────────────────────────────┐
│           Wealthica Dashboard           │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │    Developer Add-on (iframe)      │  │
│  │                                   │  │
│  │  1. wealthica.js fetches your     │  │
│  │     positions & accounts          │  │
│  │                                   │  │
│  │  2. Portfolio data is sent to     │  │
│  │     Anthropic's API (Claude)      │  │
│  │                                   │  │
│  │  3. AI analysis streams back      │  │
│  │     and renders in the add-on     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
Cost
Each analysis uses approximately 1,500-3,000 tokens (~$0.01-0.03 per analysis on Claude Sonnet). Your Anthropic API key is billed directly — Wealthica and this add-on do not charge anything.
Privacy & Security

Your API key is stored in Wealthica's add-on data (encrypted at rest, tied to your account)
Portfolio data is sent directly from your browser to Anthropic's API — no intermediary servers
No data is logged or stored by this add-on beyond your API key preference
The add-on runs entirely client-side in the browser

Tech Stack

wealthica.js — Official Wealthica add-on SDK
Anthropic Messages API — Claude Sonnet for portfolio analysis
Vanilla JS/HTML/CSS — No build step, no dependencies beyond wealthica.js

Local Development
To test locally, you can:

Open index.html directly in a browser (runs in "demo mode" with sample data)
Set your API key and click Analyze to test the AI integration
To test with real Wealthica data, use a local server (npx serve .) and load the URL in the Developer Add-on

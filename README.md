# Portfolio Intelligence — Wealthica Add-on

An AI-powered add-on for [Wealthica](https://wealthica.com) that turns your portfolio data into a full analytics dashboard with 11 tabs, interactive charts, scoring, and on-demand AI analysis powered by Claude.

## Features

### Dashboard Tabs

| Tab | What it shows |
|-----|--------------|
| **Overview** | Total value, gain/loss, health score (0-100) with sub-scores, key insights, allocation doughnut, top holdings bar chart, rebalancing calculator |
| **Holdings** | Card and table views, sortable by value/gain/return/weight/name/rating, weight chart, CSV export |
| **Sectors** | Asset class breakdown (doughnut + bar), equity sector drill-down |
| **Performance** | Period return, best/worst performers, gain/loss by position, by-account comparison, historical portfolio value line chart |
| **Risk** | Score cards (diversification, risk mgmt, performance, tax, income), concentration doughnut, weight distribution, risk factors list, correlation heatmap |
| **Region** | Geographic allocation doughnut + bar chart with currency/exchange-based inference |
| **Dividends** | Estimated annual income, portfolio yield, income vs growth split, dividend calendar (12-month), fee/MER analysis |
| **Tax** | RRSP/TFSA/non-reg placement analysis, tax-loss harvesting candidates, asset location suggestions |
| **Models** | Risk-tolerance-based model portfolio comparison, letter grade, plain-English interpretation |
| **Stress Test** | Simulated portfolio impact under market scenarios (2008 crash, COVID, rate hikes, etc.) |
| **AI Analyst** | Custom free-text questions answered by Claude with full portfolio context |

### Per-Tab AI Deep Dive

Every tab (Overview, Holdings, Sectors, Performance, Risk, Region, Dividends, Tax) has an **AI Deep Dive** button that sends tab-specific data to Claude for focused analysis. Responses are cached to avoid redundant API calls — click **Re-analyze** to refresh.

### Filters & Controls

- **Date range** — All Time, YTD, 1 Year, 5 Year. Filters the history chart, adjusts gain/loss and return metrics to the selected period.
- **Account filter** — Filter by individual account (TFSA, RRSP, non-reg, etc.)
- **Group filter** — Filter by family member / Wealthica group
- **Risk tolerance slider** — Adjusts model portfolio targets and rebalancing suggestions
- **Holdings sort** — Value, gain/loss, return %, weight, name, AI rating
- **Holdings view** — Toggle between card view and table view

### Scoring System

A composite **Portfolio Health Score** (0-100) computed from five sub-scores:

- **Diversification** (25%) — HHI on correlated-asset groups, sector count, region count, position count
- **Risk Management** (25%) — Concentration limits, top-3/top-5 weight, home bias, volatility proxy
- **Performance** (20%) — Total return, win rate, consistency
- **Tax Efficiency** (15%) — Account placement analysis (e.g., US dividends in RRSP)
- **Income Potential** (15%) — Yield, income-oriented allocation, dividend coverage

### Other Features

- **Rebalancing calculator** — 5 allocation sliders (Canada/US/International/Bonds/Other) with suggested buy/sell trades
- **Correlation heatmap** — Estimated correlation matrix for top 10 positions
- **MER/fee analysis** — Lookup table for ~50 common Canadian ETFs, weighted MER, annual fees, 10-year cost projection
- **Dividend calendar** — 12-month projected payment grid with quarterly/monthly estimation
- **CSV export** — Download holdings data with all metrics
- **Loading skeletons** — Animated placeholders while portfolio data loads
- **Light/dark theme** — Auto-detects Wealthica theme, defaults to light
- **Mobile swipe navigation** — Swipe left/right between tabs on touch devices
- **Correlated asset grouping** — BTCC.B.TO + BTC, VFV.TO + SPY, etc. treated as the same underlying for diversification scoring
- **Demo mode** — Open `index.html` directly in a browser to see sample data without Wealthica

## Setup

### Step 1: Host the Add-on

The add-on is a single HTML file. Host it anywhere with HTTPS — the easiest free option is GitHub Pages:

1. Fork or create a GitHub repository
2. Upload `index.html` to the repository
3. Go to **Settings → Pages → Source** and select "Deploy from a branch" (main branch, root folder)
4. Your URL will be: `https://YOUR_USERNAME.github.io/REPO_NAME/index.html`

### Step 2: Install in Wealthica

1. Log in to [Wealthica](https://app.wealthica.com)
2. Go to **Add-ons** and install the **Developer Add-on**
3. Click the **Configure** button (gear icon)
4. Paste your hosted URL into the **Add-on URL** field
5. Click **Load**

### Step 3: Set Your API Key

1. In the add-on, click the **Settings** (gear) button
2. Enter your Anthropic API key (get one from [console.anthropic.com](https://console.anthropic.com))
3. Click **Save** — the key persists across sessions via Wealthica preferences

### Step 4: Explore

- Browse tabs for instant chart-based analytics (no API key needed)
- Click **AI Deep Dive** on any tab for Claude-powered analysis
- Use the **AI Analyst** tab for custom free-text questions
- Adjust the date filter to compare YTD, 1-year, or 5-year performance

## How It Works

```
┌─────────────────────────────────────────────┐
│            Wealthica Dashboard              │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │     Developer Add-on (iframe)         │  │
│  │                                       │  │
│  │  1. wealthica.js SDK fetches your     │  │
│  │     positions, accounts & history     │  │
│  │                                       │  │
│  │  2. Client-side JS computes scores,   │  │
│  │     renders Chart.js visualizations   │  │
│  │                                       │  │
│  │  3. On-demand: portfolio data sent    │  │
│  │     to Anthropic API for AI analysis  │  │
│  │                                       │  │
│  │  4. Streaming response renders live   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Cost

- **Charts, scores, and dashboards** — Free (all computed client-side)
- **AI analysis** — ~1,500-3,000 tokens per request (~$0.01-0.03 on Claude Sonnet). Billed to your Anthropic API key. Cached responses avoid repeat charges.

## Privacy & Security

- Your API key is stored in Wealthica's add-on data (encrypted at rest, tied to your account)
- Portfolio data is sent directly from your browser to Anthropic's API — no intermediary servers
- No data is logged or stored beyond your API key preference
- The add-on runs entirely client-side

## Tech Stack

- **[wealthica.js](https://github.com/nicholasgasior/wealthica.js)** — Official Wealthica add-on SDK
- **[Chart.js 4](https://www.chartjs.org/)** + **chartjs-plugin-datalabels** — All charts and visualizations
- **[Anthropic Messages API](https://docs.anthropic.com/en/api/messages)** — Claude Sonnet for AI analysis (streaming)
- **Vanilla JS/HTML/CSS** — Single-file architecture, no build step, no framework dependencies

## Local Development

1. Open `index.html` directly in a browser — runs in **demo mode** with sample portfolio data (2 adults, 2 children, 15 positions across Questrade, RBC, and Shakepay)
2. Set your API key and click any AI button to test the AI integration
3. To test with real Wealthica data, use a local server (`npx serve .`) and load the URL in the Developer Add-on

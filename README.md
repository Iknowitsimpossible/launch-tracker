# Liftoff

A rocket launch tracker for anyone who wants to know what's flying next, where it's going, and how to watch it.

**Live site:** https://iknowitsimpossible.github.io/launch-tracker/

![Liftoff home page: the next launch with its photo, countdown, local time and launch site](docs/screenshot.png)

## What it does

Liftoff lists upcoming rocket launches from around the world, plus every launch from the past 30 days. Each launch has its own page with the key facts in one place, and the data refreshes every hour.

- **Countdown in your own time zone:** times show in the visitor's local time, with a live countdown and an add-to-calendar button.
- **Weather at the pad:** wind, gusts, visibility, cloud cover and chance of rain for the launch hour, for launches within about 16 days.
- **The mission:** where it's going, whether there's a crew aboard, what it's carrying, and how the booster comes back, shown as line drawings.
- **The rocket:** who builds it, a short description, size and thrust, and how many times this booster has flown.
- **Watch it:** links to official livestreams and mission pages, plus a launch photo.
- **Installable:** add it to your home screen like an app.

Built with Next.js, React and TypeScript as a static site, hosted on GitHub Pages. Launch data comes from [Launch Library 2](https://thespacedevs.com/llapi) and weather from [Open-Meteo](https://open-meteo.com).

## Installation

Requirements: [Node.js](https://nodejs.org) (the deploy workflow uses Node 26, which can run the TypeScript data script directly).

```bash
git clone https://github.com/Iknowitsimpossible/launch-tracker.git
cd launch-tracker
npm install
```

No API keys or environment variables are needed.

## Usage

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000. The home page shows the next launch at the top, then the upcoming and recent lists. Click any launch to open its page.

The site reads its data from `data/launches.json`, a snapshot committed to the repo. To download fresh data:

```bash
npm run fetch-data
```

The production Launch Library API allows only 15 requests per hour, and each run uses 2. To test the script repeatedly, point it at the development API instead:

```bash
LL_BASE_URL=https://lldev.thespacedevs.com/2.3.0 npm run fetch-data
```

To build the static site into `out/` and preview it:

```bash
npm run build
python3 -m http.server 8124 -d out
```

Then open http://localhost:8124.

## Deployment

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) fetches fresh data, builds the site and publishes it to GitHub Pages. It runs every hour, on every push to `main`, and from the "Run workflow" button on the Actions tab. Fresh data is not committed back to the repo. If the launch API is down, the hourly run fails and the last published site stays up.

## Project structure

- `scripts/fetch-launches.ts`: downloads launches and weather and writes `data/launches.json`.
- `src/lib/types.ts`: the shape of the launch data, shared by the script and the pages.
- `src/app/`: the home page and the per-launch pages (`launch/[slug]/`).
- `src/components/`: the page sections, including the mission drawings.

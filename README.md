# Complaint Machine

**Complaint Machine** is a Summer Into AI Week 3 / Data Punk project: a static, interactive data-story site about consumer finance complaints in the United States.

Live site: https://kylephoto.blob.core.windows.net/summer-into-ai/complaint-machine/index.html

Week 3 brief: https://advisoryhour.substack.com/p/summer-into-ai-week-3-theme-datapunk

## What this project is for

The project turns a public government dataset into an editorial, browser-based data experience. Instead of presenting the data as a conventional dashboard, it uses a punk/synthwave visual style and a 3D U.S. map to make consumer complaint patterns feel immediate and explorable.

The main question is:

> Where are people filing consumer finance complaints, and what are they complaining about?

The site is meant to be:

- a Summer Into AI Week 3 submission artifact,
- a public-data storytelling prototype,
- a static site that can be deployed without a backend,
- and a Substack-ready visual/narrative companion for discussing the Data Punk theme.

## Data presented

The project uses the **Consumer Financial Protection Bureau (CFPB) Consumer Complaint Database**, accessed through Data.gov and the CFPB public complaint archive.

Source links:

- Data.gov dataset: https://catalog.data.gov/dataset/consumer-complaint-database
- CFPB consumer complaints page: https://www.consumerfinance.gov/data-research/consumer-complaints/
- Bulk CSV archive: https://files.consumerfinance.gov/ccdb/complaints.csv.zip

For fast static rendering, this prototype aggregates a streamed public sample from the CFPB bulk CSV.

Current sample shown in the app:

- **234,962** public complaint rows sampled
- **233,236** rows with state codes
- State-level complaint counts
- Top complaint products
- Top complaint issues
- Most-named companies in the sample
- State-specific top products, issues, and companies

The project uses aggregate counts and issue/product categories. It does **not** display private consumer information.

## What the visualization shows

### 3D complaint atlas

The centerpiece is a Three.js 3D map of U.S. states.

- Each state is clickable.
- Clicking a state opens its complaint dossier.
- State color encodes relative complaint volume.
- State extrusion depth is intentionally uniform so volume is not double-encoded by both color and height.

### Product and issue panels

The surrounding panels summarize:

- what financial products people complain about most,
- which companies appear most often in the sampled complaints,
- and what the top CFPB issue categories mean in plain language.

Because many public complaint narratives are unavailable or redacted, the story section focuses on the structured CFPB issue categories rather than inventing unsupported narratives.

## Project structure

```txt
.
├── index.html                    # Static page shell
├── assets/
│   └── complaint-machine-hero.png # Hero/banner artwork
├── src/
│   ├── app.js                    # UI rendering, Three.js map, interactions
│   ├── data.js                   # Precomputed complaint aggregates
│   ├── styles.css                # Visual design system
│   └── us-states.json            # U.S. state geometry
└── process_complaints.py         # Script used to aggregate CFPB CSV rows into src/data.js
```

## Running locally

This is a static site. Any local HTTP server will work.

From the project directory:

```bash
python -m http.server 8173
```

Then open:

```txt
http://127.0.0.1:8173/index.html
```

A server is recommended because the app loads local JS/JSON assets and browser module behavior is more reliable over HTTP than by opening the file directly.

## Regenerating the data asset

`process_complaints.py` reads CFPB complaint CSV rows from standard input and writes the aggregate JavaScript payload to `src/data.js`.

Example shape:

```bash
python process_complaints.py < complaints.csv
```

The deployed prototype uses a precomputed `src/data.js` so the browser does not need to download or process the large raw CFPB CSV at runtime.

## Deployment

The live version is deployed as static files to Azure Blob Storage under the Summer Into AI project path:

```txt
https://kylephoto.blob.core.windows.net/summer-into-ai/complaint-machine/index.html
```

No backend service is required.

## Notes on interpretation

Complaint counts are not a direct measure of wrongdoing or market share. They reflect complaints submitted to the CFPB and included in the sampled public data. Larger states and larger financial institutions may naturally appear more often because more consumers interact with them.

The site should be read as a public-data storytelling prototype: it highlights complaint patterns, categories, and geographic concentration, but it does not make legal claims about any company or state.

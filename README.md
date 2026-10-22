# DamageDesk — Damage Claim Support Assistant

An independent, front-end prototype for a 1Now Client Success and Support hiring assessment. It uses fictional demo records and does not connect to 1Now.

## Requirements
- Node.js LTS (includes npm)
- A modern browser

## Run locally
1. Open a terminal in this folder.
2. Run `npm install`
3. Run `npm run dev`
4. Open the local URL shown in the terminal (typically `http://localhost:5173`).

## Features
- Damage claim intake and validation
- Evidence checklist with missing-evidence triage
- Urgent safety flag and escalation
- Claim statuses, notes, resolution and reopening
- Search and status filters
- Dashboard metrics derived from claim data
- Browser `localStorage` persistence
- Resettable fictional sample data

## Limitations
This is a demo only. It does not contact renters, insurers, repair shops, or 1Now. It does not prove when or by whom damage occurred and does not decide fault, liability, or coverage. Evidence status is entered by the operator and must be reviewed by a human.

## Publish to GitHub
Create an empty repository on GitHub, then from this project folder:
1. `git init` (only if the folder is not already a Git repository)
2. `git add .`
3. `git commit -m "Build damage claim support prototype"`
4. `git branch -M main`
5. `git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git`
6. `git push -u origin main`

Replace the URL with your own repository URL. Never commit secrets or credentials.

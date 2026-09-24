# FloodAlert Deployment Guide

## 1. Backend — Render

Create a new Web Service from this GitHub repository.

- Root Directory: `backend`
- Runtime: Python
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn --bind 0.0.0.0:$PORT app:app`
- Health Check Path: `/health`

After deployment, verify:
`https://YOUR-BACKEND-URL/health`

Expected response:
`{"status":"ok"}`

## 2. Frontend — Vercel

Create a new Vercel project from the same repository.

- Root Directory: `frontend`
- Framework preset: Other
- Build Command: leave empty
- Output Directory: `.`
- Install Command: leave empty

Before deployment, edit `frontend/config.js`:

```js
window.FLOOD_API_BASE_URL = "https://YOUR-BACKEND-URL";
```

Then deploy.

## 3. End-to-end test

Open the Vercel URL, log in using the demo email/password form, enter a place such as `Chennai`, and click **Detect Flood Risk**.

The browser should call:
`POST https://YOUR-BACKEND-URL/detect`

The response should contain:
- location coordinates
- detected flood regions
- region count
- severity categories
- confidence values
- approximate spatial coordinates
- implementation limitations

## Important implementation note

The current project uses classical computer vision:
HSV water-region segmentation, morphological operations, and contour analysis.

It does **not** currently contain a trained U-Net/CNN model. Do not claim U-Net/CNN inference in the README/report unless a trained model is actually integrated and evaluated.

The current project also does not use a persistent database and does not provide a real weather/LLM service in the deployed analysis pipeline.

# FloodAlert
MIni Project about flood alert


## Deployment

### Backend (Render)

The backend is a Flask API. Deploy the `backend` directory using the included
`render.yaml` or configure the service manually:

```bash
pip install -r requirements.txt
gunicorn --bind 0.0.0.0:$PORT app:app
```

Health check:

```text
GET /health
```

Flood analysis:

```text
POST /detect
Content-Type: application/json

{"place": "Chennai"}
```

### Frontend (Vercel)

The frontend is a static HTML/CSS/JavaScript application. It does not require
a Node build step.

Before publishing, edit `frontend/config.js`:

```javascript
window.FLOOD_API_BASE_URL = "https://YOUR-BACKEND-URL";
```

Then deploy the `frontend` directory as the Vercel project root.

### Important implementation note

The current repository implements classical computer vision using HSV
water-region segmentation, morphological operations, and contour analysis.
It does not currently contain a trained U-Net/CNN model. A U-Net/CNN model
should only be documented or claimed after it has actually been integrated
and evaluated.

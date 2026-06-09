# TableFor

AI group dining agent — finds the best restaurant for your whole friend group, factoring in a fair central meetup point, dietary constraints, budget, and live deals.

## Stack

- **Backend:** Python + FastAPI (AWS EC2)
- **AI:** AWS Bedrock (Claude 3.5 Sonnet)
- **Search:** Exa API + S3 cache
- **Maps:** Mapbox GL JS
- **Frontend:** React + Tailwind CSS (Vercel)
- **Storage:** AWS DynamoDB + S3
- **Payments:** Stripe (TableFor Pro teaser)

## Project structure

```
tablefor/
├── backend/
│   ├── main.py
│   ├── agent.py
│   ├── exa_search.py
│   ├── location.py
│   ├── dynamo.py
│   └── models.py
├── frontend/
│   └── src/
├── requirements.txt
└── .env.example
```

## Local development

### Backend

```bash
cp .env.example .env   # fill in API keys
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env   # fill in VITE_API_URL, VITE_MAPBOX_TOKEN
npm install
npm run dev
```

Open http://localhost:5173

## Environment variables

**Backend (`.env`):**
- `EXA_API_KEY` — Exa search
- `MAPBOX_TOKEN` — geocoding
- `STRIPE_SECRET_KEY` — checkout sessions (optional for demo)
- `FRONTEND_URL` — Stripe redirect URL
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — local dev only (EC2 uses IAM role)

**AI:** Claude 4.x via **AWS Bedrock Converse API**. Default: **Claude Sonnet 4.5**.

AWS no longer uses the old "Model access" page — models auto-enable when first invoked. For **Anthropic (Claude)**, you may need to submit a one-time use case form in **Bedrock → Model catalog** before the first call works.

| Model | When to use |
|-------|-------------|
| **Claude Sonnet 4.5** (`anthropic.claude-sonnet-4-5-20250929-v1:0`) | **Best default** — smart + fast enough for demos |
| **Claude Haiku 4.5** (`anthropic.claude-haiku-4-5-20251001-v1:0`) | Fastest live demo, still good JSON |
| **Claude Opus 4.5/4.6** | Best reasoning, slower — use if judges ask hard questions |

Set `BEDROCK_MODEL_ID` in `.env` or let the app auto-try Sonnet → Haiku → Opus.

**Frontend (`frontend/.env`):**
- `VITE_API_URL` — backend URL (e.g. `http://localhost:8000`)
- `VITE_MAPBOX_TOKEN` — Mapbox map token

## AWS deployment (EC2)

1. Launch t3.micro in `us-west-2`, open port 8000
2. Attach IAM role: Bedrock + DynamoDB + S3 access
3. SSH in, clone repo, `pip install -r requirements.txt`
4. `nohup uvicorn backend.main:app --host 0.0.0.0 --port 8000 &`
5. Set `VITE_API_URL=http://[ec2-ip]:8000` in frontend `.env`
6. Deploy frontend: `vercel --prod`

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/find` | Run dining agent |
| GET | `/session/{id}` | Load saved session |
| POST | `/save/{id}/{name}` | Save restaurant |
| GET | `/geocode/{area}` | Geocode Singapore area |
| POST | `/gps-area` | Nearest area from GPS |
| POST | `/create-checkout` | Stripe Pro checkout |

## Demo mode

Click **Try demo** on the setup screen — pre-fills 4 friends and shows hardcoded Bishan results without calling the API.

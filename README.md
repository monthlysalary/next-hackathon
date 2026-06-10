# TableFor

AI group dining agent — finds the best restaurant for your whole friend group, factoring in a fair central meetup point, dietary constraints, budget, cuisine preferences, and live deals.

## Features

- **Step-by-step preference wizard** — each person sets location, budget, dietary needs, cuisine, must-haves, and more
- **Group invite links** — host shares a `?join=` link; guests sign in and add preferences from any device
- **Live group sync** — host sees who has joined and polls for updates while setting up
- **AI restaurant search** — Exa web search + AWS Bedrock picks top 3 matches for the group
- **Cuisine-aware search** — custom cuisines (e.g. Vietnamese) are included in Exa queries
- **Meetup + travel times** — suggests an MRT area and per-person travel estimates (OneMap)
- **Group voting** — share results via `?session=` link; vote on restaurants in real time
- **Refine results** — chat-style follow-up (“quieter options”, “cheaper”, etc.)
- **TableFor Pro** — Stripe checkout for unlimited searches and larger groups (teaser)
- **Supabase auth** — sign in to save sessions; required for guests joining via invite link
- **Demo mode** — pre-filled group with sample results, no API calls

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Backend | Python, FastAPI |
| AI | AWS Bedrock (Claude Sonnet 4.5 default) |
| Search | Exa API + S3 cache |
| Maps / geocoding | Mapbox GL JS + Mapbox Geocoding |
| Travel times | LTA DataMall / OneMap |
| Storage | AWS DynamoDB + S3 (in-memory / `.local-sessions.json` fallback for local dev) |
| Auth | Supabase |
| Payments | Stripe |

## Project structure

```
next-hackathon/
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── agent.py         # Bedrock dining agent
│   ├── exa_search.py    # Restaurant search + S3 cache
│   ├── location.py      # Geocoding, MRT areas, GPS
│   ├── travel.py        # OneMap travel times
│   ├── dynamo.py        # Session storage
│   └── models.py        # Pydantic models
├── frontend/
│   ├── app/             # Next.js app router
│   ├── components/      # UI (wizard, results, auth, map)
│   ├── lib/             # API helpers, group session, Supabase
│   └── public/          # Logo + background assets
├── requirements.txt
└── .env.example
```

## Local development

### 1. Backend

```bash
cp .env.example .env   # fill in API keys
pip install -r requirements.txt
python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Create `frontend/.env` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Restarting servers

```bash
# Backend
lsof -ti:8000 | xargs kill -9
python3 -m uvicorn backend.main:app --reload --port 8000

# Frontend
lsof -ti:5173 | xargs kill -9
cd frontend && npm run dev
```

## Group invite flow

1. **Host** opens the app — a group session is created automatically
2. **Host** taps **Copy invite link** → `http://localhost:5173/?join={sessionId}`
3. **Guest** opens the link → sign-in screen → adds their preferences
4. **Host** sees join progress (`2 / 5 people joined`) and runs **Find Matches**
5. **Everyone** gets results; host/guests use **Share & Vote** → `?session={sessionId}`

> **Local dev note:** If AWS credentials are expired, sessions fall back to `.local-sessions.json` on disk. Invite links only work on the machine running the backend unless DynamoDB is configured.

## Environment variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `EXA_API_KEY` | Exa restaurant search |
| `MAPBOX_TOKEN` | Geocoding + area validation |
| `ONEMAP_ACCESS_TOKEN` | Singapore travel times |
| `BEDROCK_MODEL_ID` | Optional — defaults to Claude Sonnet 4.5 |
| `STRIPE_SECRET_KEY` | Pro checkout (optional) |
| `STRIPE_DEMO_FREE` | Set `true` to skip Stripe in demos |
| `FRONTEND_URL` | Stripe redirect URL (e.g. `http://localhost:5173`) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Local dev only (EC2 uses IAM role) |
| `AWS_DEFAULT_REGION` | e.g. `us-west-2` |

**Bedrock:** Claude models auto-enable on first use. You may need to complete Anthropic's use-case form in **Bedrock → Model catalog** before the first call.

| Model | When to use |
|-------|-------------|
| Claude Sonnet 4.5 | **Default** — best balance of quality and speed |
| Claude Haiku 4.5 | Fastest for live demos |
| Claude Opus 4.5/4.6 | Best reasoning, slower |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default `http://localhost:8000`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token for map + GPS fallback |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/find` | Run dining agent search |
| POST | `/refine` | Refine results with a message |
| POST | `/vote` | Cast a vote on a restaurant |
| GET | `/votes/{session_id}` | Get vote tallies |
| GET | `/session/{session_id}` | Load saved session / results |
| POST | `/group/create` | Create shareable group (pre-search) |
| GET | `/group/{session_id}` | Load group setup |
| PUT | `/group/{session_id}` | Host syncs group setup |
| POST | `/group/{session_id}/join` | Guest adds/updates one person |
| POST | `/save/{session_id}/{name}` | Save a restaurant |
| GET | `/geocode/{area}` | Geocode Singapore area |
| GET | `/validate-location/{area}` | Validate area name |
| GET | `/areas` | List known Singapore areas |
| POST | `/gps-area` | Nearest area from GPS coordinates |
| POST | `/create-checkout` | Stripe Pro checkout |
| POST | `/confirm-pro` | Confirm Pro after checkout |
| POST | `/cancel-pro` | Cancel Pro subscription |

## Demo mode

Click **Try demo** on the setup screen — pre-fills 4 friends and shows hardcoded results without calling the API.

## AWS deployment (EC2)

1. Launch t3.micro in `us-west-2`, open port 8000
2. Attach IAM role: Bedrock + DynamoDB + S3 access
3. SSH in, clone repo, `pip install -r requirements.txt`
4. `nohup python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &`
5. Set `NEXT_PUBLIC_API_URL=http://[ec2-ip]:8000` in frontend env
6. Deploy frontend: `vercel --prod`

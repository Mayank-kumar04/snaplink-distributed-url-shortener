# ✂️ SnapLink — URL Shortener

A scalable URL shortening service with analytics, Redis caching, and PostgreSQL.

## 🏗️ Architecture (Great for Interviews!)

```
Client (React)  →  Express API  →  Redis Cache (hit?) → Return URL
                                          ↓ (miss)
                                    PostgreSQL DB
                                          ↓
                                    Store in Redis
                                          ↓
                                     Return URL
```

### Why this design?
- **Redis** is an in-memory store — reads are ~0.1ms vs ~5ms for PostgreSQL
- **PostgreSQL** is the source of truth — persistent, relational, ACID compliant
- **Hashing** (nanoid/base62) converts long URLs to 7-char codes efficiently
- **Indexing** on `short_code` column makes lookups O(log n)

## 🚀 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite | Fast dev, component-based |
| Backend | Node.js + Express | Non-blocking I/O, great for high-throughput |
| Database | PostgreSQL | Relational, ACID, great indexing |
| Cache | Redis | Sub-millisecond reads, reduces DB load |
| Styling | Custom CSS (no UI lib) | Full control, interview-impressive |

## 📁 Project Structure

```
urlshortener/
├── backend/
│   ├── src/
│   │   ├── config/         # DB and Redis connection setup
│   │   ├── controllers/    # Route handler logic
│   │   ├── middleware/      # Rate limiting, validation
│   │   ├── models/         # SQL queries (no ORM - raw SQL for clarity)
│   │   ├── routes/         # Express route definitions
│   │   └── utils/          # Hashing, base62 encoding
│   ├── migrations/         # SQL schema files
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI pieces
│       ├── pages/          # Full page views
│       └── hooks/          # Custom React hooks
└── docker-compose.yml      # Spin up PostgreSQL + Redis instantly
```

## ⚡ Quick Start

### Option 1: With Docker (Recommended)
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Backend
cd backend
npm install
npm run migrate   # creates tables
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Option 2: Manual
1. Install PostgreSQL and Redis locally
2. Create a database: `createdb snaplink`
3. Copy `backend/.env.example` → `backend/.env` and fill in values
4. Run `npm run migrate` in backend
5. Start both servers

## 🎯 Key Interview Talking Points

1. **Hashing Strategy**: We use nanoid to generate random 7-char alphanumeric codes (base62: a-z, A-Z, 0-9). This gives 62^7 = 3.5 trillion possible URLs — essentially collision-free at scale.

2. **Redis Caching**: Cache-aside pattern. On redirect: check Redis first (TTL: 24h), fall back to PostgreSQL on miss, then populate cache. Reduces DB queries by ~80% for popular URLs.

3. **Database Indexing**: `short_code` has a UNIQUE INDEX — PostgreSQL uses B-tree index for O(log n) lookups instead of O(n) full table scan.

4. **Analytics**: Every click increments a counter (Redis for real-time, PostgreSQL for persistence) and stores metadata (IP, user-agent, timestamp) for reporting.

5. **Rate Limiting**: Express middleware limits to 10 URL creations per IP per hour using Redis counters — prevents abuse.

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/urls` | Create short URL |
| GET | `/:code` | Redirect to original URL |
| GET | `/api/urls/:code/analytics` | Get click analytics |
| GET | `/api/urls` | List all URLs (paginated) |
| DELETE | `/api/urls/:code` | Delete a URL |

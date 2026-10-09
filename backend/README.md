# EcoGuard Backend

Backend server built with **Node.js**, **Express**, **TypeScript**, and **MongoDB (Mongoose)**.

## Architecture & Modular Separation

To clearly separate logic for the **Web App** and the **Mobile App**, endpoints and controllers are structured in dedicated modules under `src/modules/`:

```text
backend/
├── .env                              # Environment configuration (ports, DB URI, client origins)
├── .env.example                      # Template environment variables
├── src/
│   ├── config/
│   │   └── db.ts                     # MongoDB connection handling
│   ├── models/                       # Shared Mongoose database models
│   │   └── index.ts
│   ├── modules/
│   │   ├── webapp/                   # 💻 WebApp specific backend logic
│   │   │   ├── controllers/
│   │   │   │   └── webapp.controller.ts
│   │   │   ├── routes/
│   │   │   │   └── webapp.routes.ts   # Routes mounted at /api/webapp/*
│   │   │   └── index.ts
│   │   ├── mobile/                   # 📱 Mobile specific backend logic
│   │   │   ├── controllers/
│   │   │   │   └── mobile.controller.ts
│   │   │   ├── routes/
│   │   │   │   └── mobile.routes.ts   # Routes mounted at /api/mobile/*
│   │   │   └── index.ts
│   │   └── common/
│   │       └── health.routes.ts      # Health check at /api/health
│   └── index.ts                      # Server gateway & route registration
```

## API Route Namespaces

| Purpose | Base Route | File Location |
|---|---|---|
| **Web Application APIs** | `/api/webapp/*` | `src/modules/webapp/` |
| **Mobile Application APIs** | `/api/mobile/*` | `src/modules/mobile/` |
| **System Health Check** | `/api/health` | `src/modules/common/health.routes.ts` |
| **Shared DB Models** | — | `src/models/` |

## Scripts

```powershell
# Run development server with live reload
npm run dev

# Compile TypeScript
npm run build

# Run production build
npm start
```

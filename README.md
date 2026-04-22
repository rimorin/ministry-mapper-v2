<a id="readme-top"></a>

<div align="center">

# Ministry Mapper

### Digital Territory Management for Field Ministry

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![PocketBase](https://img.shields.io/badge/PocketBase-backend-b8dbe4?logo=pocketbase)](https://pocketbase.io)

[📖 Documentation](https://doc.ministry-mapper.com/) · [🐛 Report Bug](../../issues) · [✨ Request Feature](../../issues)

![Ministry Mapper Screenshot](https://user-images.githubusercontent.com/40650158/185554709-ce94a04e-2a34-43a9-b7de-09aa7f437139.png)

</div>

---

> **⚠️ Privacy Notice**  
> Ministry Mapper tracks residential addresses, which may be subject to data privacy laws (GDPR, CCPA, LGPD, etc.). Please review your local regulations and ensure compliance before deployment.

---

<details>
<summary>📋 Table of Contents</summary>

- [Overview](#-overview)
- [Motivation](#-motivation)
- [Features](#-features)
- [Architecture](#-architecture)
- [Built With](#-built-with)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Security](#-security)

</details>

---

## 📖 Overview

Ministry Mapper is a modern, cloud-based web application for field ministry territory management — featuring real-time collaboration, interactive mapping, and comprehensive tracking, accessible from any device, anywhere in the world.

**Version 2** represents a complete architectural overhaul from Firebase to [PocketBase](https://pocketbase.io), eliminating vendor lock-in while providing superior querying capabilities and full data ownership.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 💡 Motivation

Ministry Mapper was born out of a firsthand frustration with managing territory records on paper. Like many congregations, the process relied on physical maps and handwritten notes — a workflow riddled with well-documented drawbacks:

| Pain Point | Impact |
|---|---|
| 📄 **Lost or damaged records** | Physical damage or misplacement permanently destroys records |
| ✏️ **Illegible handwriting** | Handwritten notes are easily misread, causing errors and confusion |
| 🔁 **Duplicate work** | Without shared visibility, the same addresses get revisited unknowingly |
| 🗂️ **Poor organisation** | Sorting, filtering, or searching records requires manually combing through paper |
| 📬 **Inaccessible records** | Territories can only be accessed or assigned in person, creating unnecessary delays |
| 🗃️ **Decentralised records** | No single source of truth — records scattered across individuals |

Digital systems consistently outperform paper in accuracy, accessibility, and durability. Ministry Mapper exists to close that gap — bringing territory management into the modern era with real-time collaboration, cloud storage, and a device-friendly experience that anyone in the congregation can use.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

**🗺️ Territory Management**
- Interactive maps via OpenStreetMap + Leaflet
- Real-time sync — live updates across all users
- Smart territory assignment with proximity matching
- Multi-floor building support
- Drag-and-drop address sequencing
- Quick Links for fast territory sharing

</td>
<td width="50%" valign="top">

**👥 Admin & Reporting**
- Role-based access control per congregation
- On-demand & automated monthly Excel reports
- AI-powered report summaries
- Account lifecycle management (inactivity warnings)
- Google OAuth2 sign-in

</td>
</tr>
<tr>
<td width="50%" valign="top">

**📱 Modern Experience**
- Installable on mobile & desktop via web manifest
- Dark mode support
- 8 languages: EN, ES, ID, JA, KO, MS, TA, ZH
- Virtual scrolling for large datasets

</td>
<td width="50%" valign="top">

**🔒 Self-Hosted & Private**
- Full data ownership with self-hosted backend
- GDPR-aware — no third-party data sharing
- Configurable privacy, terms & about URLs
- Error tracking with Sentry (optional)
- Privacy-friendly analytics with Umami (optional)

</td>
</tr>
</table>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Ministry Mapper                          │
├────────────────────────────┬────────────────────────────────────┤
│   Frontend  (this repo)    │   Backend  (ministry-mapper-be)    │
│                            │                                    │
│   React 19 + TypeScript    │   Go + PocketBase                  │
│   Vite                     │   SQLite (embedded)                │
│   Leaflet Maps             │   REST API + Real-time Events      │
│   i18n · 8 languages       │   Scheduled Jobs (Cron)            │
│   Sentry                   │   MailerSend · OpenAI · LaunchDark │
│   Umami Analytics          │                                    │
└────────────────────────────┴────────────────────────────────────┘
             │                              │
             └────────── PocketBase ────────┘
                       SDK + WebSocket
```

The frontend communicates with the backend via the [PocketBase JS SDK](https://github.com/pocketbase/js-sdk), using both REST calls and real-time WebSocket subscriptions for live collaboration.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🛠️ Built With

[![React][react-badge]][react-url] [![TypeScript][ts-badge]][ts-url] [![Vite][vite-badge]][vite-url] [![Bootstrap][bootstrap-badge]][bootstrap-url] [![Leaflet][leaflet-badge]][leaflet-url] [![PocketBase][pb-badge]][pb-url] [![Sentry][sentry-badge]][sentry-url] [![Vitest][vitest-badge]][vitest-url]

| Category | Technology |
|---|---|
| **UI Framework** | React 19 with React Compiler |
| **Language** | TypeScript 5.9 (strict mode) |
| **Build Tool** | Vite 8 |
| **Styling** | Bootstrap 5.3 + SASS |
| **Mapping** | Leaflet 1.9 + React-Leaflet + OpenStreetMap |
| **Routing** | Wouter (lightweight client-side router) |
| **Backend** | PocketBase (self-hosted BaaS on Go + SQLite) |
| **Testing** | Vitest |
| **Error Tracking** | Sentry |
| **Analytics** | Umami (privacy-friendly, self-hostable) |
| **i18n** | i18next |
| **CI/CD** | GitHub Actions + Semantic Release |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 22.0.0 — [download](https://nodejs.org/)
- A running **PocketBase backend** — see [Backend Setup](#backend-setup) below

### Backend Setup

This frontend requires the [Ministry Mapper Backend](https://github.com/rimorin/ministry-mapper-be) to function. Set it up first:

1. Clone the [backend repository](https://github.com/rimorin/ministry-mapper-be) and follow its README
2. Configure the backend environment variables
3. Start the server — it runs on `http://localhost:8090` by default
4. Verify the PocketBase admin UI loads at `http://localhost:8090/_/`

### Installation

```bash
# 1. Clone this repository
git clone <repository-url>
cd ministry-mapper-v2

# 2. Install dependencies
npm install

# 3. Copy and configure the environment file
cp .env.example .env
# Edit .env with your values — see the table below
```

### Environment Variables

| Variable | Required | Description |
|---|:---:|---|
| `VITE_POCKETBASE_URL` | ✅ | URL of your PocketBase backend (e.g. `http://localhost:8090`) |
| `VITE_SYSTEM_ENVIRONMENT` | ✅ | `local` \| `staging` \| `production` |

| `VITE_LOCATIONIQ_API_KEY` | ✅ | [LocationIQ](https://locationiq.com/) API key (geocoding and routing) |
| `VITE_PRIVACY_URL` | ✅ | Link to your privacy policy |
| `VITE_TERMS_URL` | ✅ | Link to your terms of service |
| `VITE_ABOUT_URL` | ✅ | Link to your about page |
| `VITE_SENTRY_DSN` | ⚠️ | Sentry DSN for error tracking (optional) |
| `SENTRY_AUTH_TOKEN` | ⚠️ | Sentry auth token for source map uploads (optional) |
| `VITE_UMAMI_SRC_URL` | ⚠️ | Umami analytics script URL (optional) |
| `VITE_UMAMI_WEBSITE_ID` | ⚠️ | Umami website ID for analytics (optional) |
| `VITE_UMAMI_DOMAINS` | ⚠️ | Comma-separated domains for Umami tracking (optional) |

Then start the development server:

```bash
npm start
# Opens at http://localhost:3000
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start development server with HMR |
| `npm run build` | Create optimized production build |
| `npm test` | Run test suite |
| `npm run test:coverage` | Generate test coverage report |
| `npm run prettier:fix` | Auto-fix code formatting |
| `npm run serve` | Preview production build locally |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🌍 Deployment

The production build outputs static files to `build/`. Deploy to any static hosting provider:

```bash
npm run build
# Deploy the contents of build/ to your hosting provider
```

| Platform | Notes |
|---|---|
| [Vercel](https://vercel.com) | Auto-detects Vite, zero-config |
| [Netlify](https://netlify.com) | Simple static hosting with CI |
| [Cloudflare Pages](https://pages.cloudflare.com) | CDN-backed, fast global delivery |
| [AWS S3 + CloudFront](https://aws.amazon.com/s3/) | For AWS-centric infrastructure |

> **Backend Deployment:** See the [Ministry Mapper BE](https://github.com/rimorin/ministry-mapper-be) repository for Docker-based self-hosting guides supporting Coolify, Fly.io, Railway, and Render.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📚 Documentation

| Resource | Link |
|---|---|
| 📖 Official Docs | [doc.ministry-mapper.com](https://doc.ministry-mapper.com/) |
| 🏗️ Architecture | [Architecture & Design Decisions](https://doc.ministry-mapper.com/architecture/) |
| 🚀 Deployment Guide | [Deployment](https://doc.ministry-mapper.com/deployment/) |
| ⚙️ Backend Repo | [ministry-mapper-be](https://github.com/rimorin/ministry-mapper-be) |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes (TypeScript strict mode; tests required)
4. Format: `npm run prettier:fix` and lint-check: `npm test`
5. Commit following [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m 'feat: add amazing feature'`
6. Push and open a Pull Request

See [DOCUMENTATION.md](DOCUMENTATION.md#14-contributing-guidelines) for detailed guidelines.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

## 🔒 Security

For security concerns, please review our [Security Policy](SECURITY.md).

---

<div align="center">

**Built with ❤️ for ministry work worldwide**

[⬆ Back to Top](#readme-top)

</div>

<!-- Badge definitions -->
[react-badge]: https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white
[react-url]: https://react.dev
[ts-badge]: https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white
[ts-url]: https://www.typescriptlang.org/
[vite-badge]: https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white
[vite-url]: https://vite.dev
[bootstrap-badge]: https://img.shields.io/badge/Bootstrap-5.3-7952b3?logo=bootstrap&logoColor=white
[bootstrap-url]: https://getbootstrap.com
[leaflet-badge]: https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white
[leaflet-url]: https://leafletjs.com
[pb-badge]: https://img.shields.io/badge/PocketBase-backend-b8dbe4?logo=pocketbase
[pb-url]: https://pocketbase.io
[sentry-badge]: https://img.shields.io/badge/Sentry-monitoring-362d59?logo=sentry&logoColor=white
[sentry-url]: https://sentry.io
[vitest-badge]: https://img.shields.io/badge/Vitest-testing-6e9f18?logo=vitest&logoColor=white
[vitest-url]: https://vitest.dev

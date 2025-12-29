<div align="center">

# Ministry Mapper

### Digital Territory Management for Field Ministry

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19.2.3-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.9.3-3178c6.svg)](https://www.typescriptlang.org/)

![Ministry Mapper Screenshot](https://user-images.githubusercontent.com/40650158/185554709-ce94a04e-2a34-43a9-b7de-09aa7f437139.png)

</div>

---

> **⚠️ Privacy Notice**  
> Ministry Mapper tracks residential addresses, which may be subject to data privacy laws (GDPR, CCPA, LGPD, etc.). Please review your local regulations and ensure compliance before deployment.

---

## 📖 Overview

Ministry Mapper is a modern, cloud-based web application designed to digitize field ministry territory management. Built with cutting-edge technologies, it replaces traditional paper-based systems with real-time collaboration, interactive mapping, and comprehensive tracking capabilities.

**Version 2** represents a complete architectural overhaul from Firebase to [PocketBase](https://pocketbase.io), eliminating vendor lock-in while providing superior querying capabilities and full data control.

## ✨ Key Benefits

### 🌱 Environmental Impact

Eliminate paper waste and reduce your congregation's carbon footprint while improving legibility and durability of territory records.

### ⚡ Real-Time Collaboration

Live updates keep all users synchronized, minimizing overlap and maximizing territory coverage efficiency.

### 🌍 Universal Access

Cloud-based platform enables ministry work to continue smoothly, regardless of territory conductor availability.

### 📱 Modern Experience

Progressive Web App (PWA) technology provides native app-like experience on any device, installable on mobile and desktop.

## 🚀 Features

<table>
<tr>
<td width="50%">

### Core Capabilities

- 📍 **Interactive Mapping** - OpenStreetMap with Leaflet
- 🔄 **Real-Time Sync** - Live updates across all users
- 🌐 **Multi-Language** - 7 languages supported
- 🎨 **Dark Mode** - Theme preferences
- 📱 **Installable** - PWA with native app experience
- ⚡ **Virtual Lists** - Handle large datasets
- 🔗 **Quick Links** - Fast territory sharing

</td>
<td width="50%">

### Technical Stack

- ⚛️ **React 19** with React Compiler
- 📘 **TypeScript** for type safety
- ⚡ **Vite** for blazing-fast builds
- 🗄️ **PocketBase** backend
- 🎯 **Wouter** lightweight routing
- 🔍 **Sentry** error tracking
- ✅ **Vitest** for testing

</td>
</tr>
</table>

## 📋 Requirements

- **Node.js** >= 22.0.0
- **PocketBase** backend server ([Setup Guide](https://github.com/rimorin/ministry-mapper-be))

> **Important:** The frontend requires a configured PocketBase backend to function. See the [Ministry Mapper BE](https://github.com/rimorin/ministry-mapper-be) repository for backend setup instructions.

## 🛠️ Getting Started

### Local Development

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd ministry-mapper-v2
   npm install
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required Environment Variables**

   ```env
   VITE_POCKETBASE_URL=http://localhost:8090
   VITE_SYSTEM_ENVIRONMENT=local
   VITE_VERSION=$npm_package_version
   VITE_OPENROUTE_API_KEY=your_key_here
   VITE_LOCATIONIQ_API_KEY=your_key_here
   VITE_SENTRY_DSN=your_sentry_dsn
   VITE_PRIVACY_URL=https://your-site.com/privacy
   VITE_TERMS_URL=https://your-site.com/terms
   VITE_ABOUT_URL=https://your-site.com/about
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```
   Opens at `http://localhost:3000`

### Production Build

```bash
npm run build
```

Output directory: `build/`

The build folder contains optimized production-ready files. Deploy to any static hosting provider (Vercel, Netlify, Cloudflare Pages, AWS S3, etc.).

### Sentry Setup (Optional)

For error tracking and performance monitoring:

1. Create a [Sentry](https://sentry.io/) account
2. Create a React project
3. Get your DSN from project settings
4. Add to environment variables:
   - `VITE_SENTRY_DSN` - Your project DSN
   - `VITE_SYSTEM_ENVIRONMENT` - Set to "production" for production
   - `VITE_VERSION` - Defaults to package version

## 📜 Available Scripts

| Command                | Description                       |
| ---------------------- | --------------------------------- |
| `npm start`            | Start development server with HMR |
| `npm run build`        | Create production build           |
| `npm test`             | Run test suite                    |
| `npm run prettier`     | Check code formatting             |
| `npm run prettier:fix` | Auto-fix code formatting          |
| `npm run serve`        | Preview production build locally  |

## 📚 Documentation

For comprehensive technical documentation, architecture details, and development guides, see the [official documentation](https://doc.ministry-mapper.com/).

### Quick Links

- 🏗️ [Architecture & Design Decisions](https://doc.ministry-mapper.com/architecture/#system-architecture)
- 🔧 [Technology Stack Details](https://doc.ministry-mapper.com/architecture/#technology-stack)
- 🚀 [Deployment Guide](https://doc.ministry-mapper.com/deployment/)

## 🤝 Contributing

Contributions are welcome! Please ensure:

- Code follows TypeScript strict mode standards
- All tests pass (`npm test`)
- Code is formatted with Prettier (`npm run prettier:fix`)
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) format

See [DOCUMENTATION.md](DOCUMENTATION.md#14-contributing-guidelines) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

For security concerns, please review our [Security Policy](SECURITY.md).

## 📞 Support

- 📖 [Documentation](https://doc.ministry-mapper.com/)
- 🐛 [Issue Tracker](../../issues)

---

<div align="center">

**Built with ❤️ for ministry work worldwide**

[⬆ Back to Top](#ministry-mapper)

</div>

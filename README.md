![Screenshot 2022-08-19 at 2 10 11 PM](https://user-images.githubusercontent.com/40650158/185554709-ce94a04e-2a34-43a9-b7de-09aa7f437139.png)

**Important Notice**: Ministry Mapper tracks residential addresses, which may be subject to data privacy laws. These laws vary significantly between countries and regions (such as GDPR in Europe, CCPA in California, LGPD in Brazil, etc.). Please thoroughly review your local regulations and ensure compliance before using Ministry Mapper to avoid legal issues.

A web application for the field ministry.

## Introduction

This is a comprehensive overhaul of version 1 of the app, which was based on Firebase and had limitations on querying and vendor lock-in concerns. The most significant change is the transition to a [PocketBase](https://pocketbase.io) backend, which is open source and provides more flexibility in data management.

## Why Ministry Mapper Stands Out

Facing the Challenges of Traditional Printed Territory Management:

- **Environmental Concerns**: The conventional approach relies heavily on paper, leading to significant environmental waste. Imagine the impact: each congregation uses approximately four sheets of paper per territory, a number that quickly adds up with each territory managed throughout the year.
- **Operational Burdens**: Designing, printing, and preparing territory slips is not only resource-intensive but also time-consuming, diverting valuable time from ministry work.
- **Update Inefficiencies**: The manual process of updating returned slips is prone to errors and can be incredibly tedious, often resulting in outdated or inaccurate territory records.
- **Risk of Loss or Damage**: Paper slips are susceptible to being lost or returned in a state that renders them unusable, creating gaps in territory coverage and hindering ministry efforts.
- **Dependence on Availability**: The effectiveness of the traditional system hinges on the physical presence of the territory conductor. Their absence can lead to disruptions in ministry activities.

### The Ministry Mapper Advantage

- **Eco-Friendly Efficiency**: Transitioning to Ministry Mapper eliminates the need for paper, significantly reducing your environmental footprint while addressing common issues such as legibility and damage to physical slips.

- **Simplified Territory Management**: Our cloud-based platform dramatically lightens the load for territory servants. With digital records, the cumbersome tasks of manual updates, printing, and cutting become things of the past.

- **Real-Time Collaboration**: Ministry Mapper introduces a dynamic, real-time update system, enhancing collaboration among publishers. This ensures that territory coverage is both efficient and effective, with minimal overlap between publishers engaging in different forms of ministry.

- **Uninterrupted Ministry Work**: The digital distribution and management of territories mean that ministry activities can proceed smoothly, without interruption, even in the face of unexpected challenges affecting the territory conductor.

### Embracing Ministry Mapper: What to Expect

Adopting Ministry Mapper is a forward-thinking move, but it's important to consider:

- **Initial Setup**: Transitioning your territory details to a digital format is a one-time effort that requires dedication. We provide resources and support to facilitate a smooth transition.

- **Internet Dependency**: The functionality of Ministry Mapper is reliant on internet connectivity. In areas where internet access is limited or unreliable, this could pose a challenge. Planning and preparation can help mitigate these issues.

- **Ease of Adoption**: Moving from paper to digital is a significant change, especially for those less accustomed to technology. We're committed to providing comprehensive support and training to ensure a seamless transition for all users, empowering every member of your congregation to confidently utilize Ministry Mapper.

### Technical Overview

Ministry Mapper is a modern web application built with cutting-edge technologies:

**Core Technologies:**
- **React 19** with the new React Compiler for optimized performance
- **TypeScript** for type-safe development
- **Vite** as the build tool
- **Wouter** for lightweight routing
- **PocketBase** for backend data storage, synchronization, and user management

**Key Features:**
- **Progressive Web App (PWA)**: Installable on devices with offline capabilities
- **Leaflet Mapping Library**: Uses OpenStreetMap data with the Leaflet library, providing universal availability without geographic restrictions
- **Internationalization (i18n)**: Multi-language support for global congregations
- **Dark Mode**: Built-in theme support for user preference
- **Real-time Collaboration**: Live updates across all users
- **Virtual Listing**: Optimized performance for handling large territory datasets
- **Drag & Drop Sequencing**: Intuitive territory reordering
- **Territory Quick Links**: Fast sharing and access to specific territories
- **Google OAuth**: Streamlined authentication option

**Monitoring & Quality:**
- **Sentry Integration**: Comprehensive error tracking and performance monitoring
- **Automated Testing**: Vitest for unit and integration tests
- **Code Quality Tools**: ESLint, Prettier, Husky, and lint-staged for consistent code standards
- **Semantic Release**: Automated versioning and changelog generation

The application can be hosted on any cloud infrastructure provider such as Vercel, Netlify, or AWS.

### Deployment

**Important**: The Ministry Mapper frontend requires a properly configured backend engine to function. The frontend application alone will not work without the backend component being deployed and accessible. Please refer to the [Ministry Mapper BE](https://github.com/rimorin/ministry-mapper-be) documentation for instructions on setting up the backend engine.

- Sentry setup

  1. Create [Sentry](https://sentry.io/) account
  2. Create a React project
  3. Go to settings and retrieve the DSN key
  4. Configure the following Sentry-related environment variables when building:
     - `VITE_SENTRY_DSN`: Your Sentry project DSN
     - `VITE_SYSTEM_ENVIRONMENT`: Set to "production" for production environments (affects tracing sample rate)
     - `VITE_VERSION`: Used for release tracking in Sentry (defaults to package version)

- Local deployment

  1. Setup .env with the following environment variables and their values.
     - VITE_SYSTEM_ENVIRONMENT=local
     - VITE_VERSION=$npm_package_version
     - VITE_OPENROUTE_API_KEY= (OpenRouteService API key for routing)
     - VITE_LOCATIONIQ_API_KEY= (LocationIQ API key for geocoding)
     - VITE_PRIVACY_URL=
     - VITE_TERMS_URL=
     - VITE_ABOUT_URL=
     - VITE_POCKETBASE_URL=
     - VITE_SENTRY_DSN=
  2. Install dependencies: `npm install`
  3. Run `npm start` to start the development server

- Production deployment
  1. Run `npm run build`
  2. When building, ensure the following environment variables are configured.
     - VITE_SYSTEM_ENVIRONMENT=production
     - VITE_VERSION=$npm_package_version
     - VITE_OPENROUTE_API_KEY= (OpenRouteService API key for routing)
     - VITE_LOCATIONIQ_API_KEY= (LocationIQ API key for geocoding)
     - VITE_PRIVACY_URL=
     - VITE_TERMS_URL=
     - VITE_ABOUT_URL=
     - VITE_POCKETBASE_URL=
     - VITE_SENTRY_DSN=
  3. Copy the contents of the `build` folder to your hosting provider.

### Development

**Requirements:**
- Node.js >= 22.0.0

**Available Scripts:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run prettier` - Check code formatting
- `npm run prettier:fix` - Fix code formatting
- `npm run serve` - Preview production build locally

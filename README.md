![Screenshot 2022-08-19 at 2 10 11 PM](https://user-images.githubusercontent.com/40650158/185554709-ce94a04e-2a34-43a9-b7de-09aa7f437139.png)

**Important Notice**: Ministry Mapper tracks residential addresses, which may be subject to data privacy laws. Please review your local regulations and ensure compliance before using Ministry Mapper to avoid legal issues.

A web application for the field ministry.

## Introduction

This is a comprehensive overhaul of version 1 of the app, which was based on Firebase and had limitations on querying and vendor lock-in concerns. The most significant change is the transition to a [PocketBase](https://pocketbase.io) backend, which is open source and offers enhanced performance and scalability.

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

Ministry Mapper is a web application built using ReactJs, Typescript, and Pocketbase. It leverages [Pocketbase](https://pocketbase.io) for data storage, synchronization, and user management. The application can be hosted on any cloud infrastructure provider such as Vercel, Netlify, or AWS.

To ensure the highest level of operational reliability, Ministry Mapper leverages Rollbar for comprehensive error tracking and monitoring. This integration not only enhances the user experience by minimizing disruptions but also provides valuable insights for continuous improvement and swift issue resolution.

For territory management, Ministry Mapper utilizes Google Maps API to display territories and facilitate efficient navigation. This feature enhances the user experience by providing a visual representation of territories and enabling users to easily locate and access specific areas.

### Deployment

- Pocketbase setup

  1. Create Pocketbase instance and setup database

- Rollbar setup

  1. Create [Rollbar](https://rollbar.com/) account
  2. Create a React project
  3. Go to setting and retrieve client keys DSN.
  4. Copy access token to environment variable, `VITE_ROLLBAR_ACCESS_TOKEN` when building for production.

- Local deployment

  1. Setup .env with the following environment variables and their values.
     - VITE_SYSTEM_ENVIRONMENT=local
     - VITE_VERSION=$npm_package_version
     - VITE_GOOGLE_MAPS_API_KEY=AIzaSyDp4sZVdKI4xrMLldYvH6EZkphlkgwh4Yc
     - VITE_PRIVACY_URL=https://www.freeprivacypolicy.com/live/6e19a525-242a-4d9b-944f-341ce8323872
     - VITE_TERMS_URL=https://www.freeprivacypolicy.com/live/ffd903e2-ed3b-4bdc-a36b-1f4c6da20ece
     - VITE_ABOUT_URL=https://rimorin.github.io/ministry-mapper-doc
     - VITE_POCKETBASE_URL=http://127.0.0.1:8090
  2. Restart shell and run `npm start`

- Production deployment
  1. Run `npm run build`
  2. Copy build package into a cloud CDN provider of your choice.
  3. When deploying, ensure the following environment variables are configured.
     - VITE_SYSTEM_ENVIRONMENT=production
     - VITE_VERSION=$npm_package_version
     - VITE_GOOGLE_MAPS_API_KEY=AIzaSyDp4sZVdKI4xrMLldYvH6EZkphlkgwh4Yc
     - VITE_PRIVACY_URL=https://www.freeprivacypolicy.com/live/6e19a525-242a-4d9b-944f-341ce8323872
     - VITE_TERMS_URL=https://www.freeprivacypolicy.com/live/ffd903e2-ed3b-4bdc-a36b-1f4c6da20ece
     - VITE_ABOUT_URL=https://rimorin.github.io/ministry-mapper-doc
     - VITE_POCKETBASE_URL=http://127.0.0.1:8090

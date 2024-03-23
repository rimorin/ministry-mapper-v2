> :warning: **IMPORTANT**: This application is still in active development and is not ready for production use.

![Screenshot 2022-08-19 at 2 10 11 PM](https://user-images.githubusercontent.com/40650158/185554709-ce94a04e-2a34-43a9-b7de-09aa7f437139.png)

Welcome to Ministry Mapper V2, a web application for the field ministry. This version is currently under active development, with a focus on enhancing user experience and functionality.

## Why Ministry Mapper V2?

Ministry Mapper V2 addresses the pain points of traditional printed territory slips and introduces several advantages over the previous version. It leverages the power of digital technology, reducing the use of paper and the risk of slips going missing or being returned in bad conditions.

The application is built on Firestore and Material UI, providing a robust, scalable, and user-friendly platform for managing territory records.

### Advantages of Ministry Mapper V2

- **Digital Technology**: Slips are stored online in Firestore, eliminating the use of paper and the risk of slips going missing or being damaged.
- **Efficient Management**: The application significantly reduces the workload on territory servants, with records stored in the cloud.
- **Real-time Collaboration**: Territory records are displayed in real-time, enabling efficient and effective coverage of territory.
- **High Availability**: Slips are managed and distributed digitally, ensuring minimal disruption to the ministry.

### Disadvantages of Ministry Mapper V2

- **Initial Migration Work**: Territory servants will need to enter their entire territory details into the system.
- **Internet Dependency**: The system requires internet access, which may not be readily available in some countries.
- **Learning Curve**: Some users may need time to transition from paper/pen to using a computing device for updating territory records.

### Usage

Configuration is done using a separate [administration module](https://github.com/rimorin/ministry-mapper-admin).

### Deployment

The application is deployed using Firebase, with additional setup for Firebase Appcheck and Firebase Functions. Local and production deployment instructions are provided, along with the necessary environment variables.

### Technologies Used

1. Material UI - UI Framework
2. Vite - Build tool
3. ReactJs - Javascript UI Framework
4. Typescript - Javascript typed implementation library
5. Rollbar - App error tracking and monitoring
6. Firestore - Cloud-based NoSQL database
7. Firebase Authentication - Cloud-based authentication service
8. Firebase Appcheck - Protects your app from abuse by attesting that incoming traffic and blocking traffic without valid credentials
9. Firebase Functions - Cloud-based backend job scheduler
10. MailerSend - Email delivery service

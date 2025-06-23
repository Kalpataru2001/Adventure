export const environment = {
    production: true,
    // --- ADD THIS LINE ---
    apiUrl: 'https://your-production-api-url.com/api', // The real URL of your deployed backend

    googleClientId: 'YOUR_PRODUCTION_GOOGLE_CLIENT_ID', // You should have a separate ID for production
    firebase: {
        // Your production Firebase config
        apiKey: "...",
        authDomain: "...",
        // ...
    }
  };
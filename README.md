# TradingBot V2 - Frontend

This is the Angular frontend for the TradingBot V2 application.

## Features
- User authentication
- Account management
- Transaction tracking
- Budget planning and monitoring
- Financial insights and analytics

## Development Setup

### Prerequisites
- Node.js (>= 14.x)
- npm (>= 6.x)

### Installation
1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
```
npm install
```

### Running the development server
```
npm start
```
This will launch the application at `http://localhost:4200/`

### Building for production
```
npm run build
```
The build artifacts will be stored in the `dist/` directory.

## Integration with Backend
This frontend is designed to work with the Spring Boot backend of TradingBot V2. Make sure the backend server is running on http://localhost:8080 or update the API URL in the environment configuration.

## Customizing the API URL
- For development: Update `src/environments/environment.ts`
- For production: Update `src/environments/environment.prod.ts`

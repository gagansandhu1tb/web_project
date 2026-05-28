# CampusFix

A full-stack campus maintenance reporting app built with React, Vite, Express, and MongoDB.

## Features
- Submit campus maintenance reports with category, building, description, optional photo, and location.
- Store reports persistently in MongoDB Atlas.
- View dynamic issue lists, filter by status and category, add status comments, and update report progress.
- External OpenStreetMap geocoding integration for campus locations.
- Export report data as CSV for sharing or audit.
- Dynamic guidance served from the backend API.
- Simple login session saved in browser storage.

## Project structure
- `src/` — React frontend components and styles.
- `server.js` — Express API server.
- `server/models/Issue.js` — Mongoose schema for issue reports.
- `.env.example` — Example environment variables.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and add your MongoDB Atlas connection string:
   ```bash
   copy .env.example .env
   ```
   Then fill in the password placeholder in `MONGODB_URI`.

  Example connection string (replace the password):

  ```text
  MONGODB_URI="mongodb+srv://gagan:YOUR_PASSWORD@cluster0.rjal6j8.mongodb.net/campusfix?retryWrites=true&w=majority"
  ```

  Add a strong JWT secret too:

  ```text
  JWT_SECRET=your_super_secret_key
  VITE_API_BASE=http://localhost:5000
  ```

  If your password contains special characters, URL-encode them (for example, `@` -> `%40`).

3. Optionally use the seeded test accounts after first startup:
   - admin@stmarys.ac.uk / Admin123!
   - staff@stmarys.ac.uk / Staff123!
   - student@stmarys.ac.uk / Student123!

> If you see `EADDRINUSE: address already in use :::5000`, stop the running Node process on port `5000` or change `PORT` in `.env` before restarting.

## Run

- Start the backend server:
  ```bash
  npm run server
  ```
- Start the frontend dev app:
  ```bash
  npm run dev
  ```
- Or run both concurrently:
  ```bash
  npm run dev:all
  ```

Open the app at `http://localhost:5173`.

## Notes
- The backend API is proxied through Vite at `/api`.
- Reports are stored in MongoDB Atlas and available across sessions.
- The app uses OpenStreetMap geocoding to enrich location references.

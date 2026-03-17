<<<<<<< HEAD
# LMS-FRONTEND
=======
# Joining Dots Frontend

A Next.js application for the Joining Dots platform.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (preferred package manager)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env.local` file with the following content:

   ```
   # API Configuration
   NEXT_PUBLIC_API_BASE_URL=https://joining-dots-backend-eta.vercel.app/api

   # Environment
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Project Structure

- `src/app`: Next.js App Router pages and layouts
- `src/components`: Reusable UI components
- `src/lib`: Utility functions and API clients
- `src/hooks`: Custom React hooks
- `public`: Static assets

## Features

- User authentication
- Session management
- Quizzes and polls
- Content delivery
- Leaderboards

## Technologies

- Next.js 14+
- React 18+
- Tailwind CSS
- Shadcn UI
- Tanstack Query
- Axios

## Deploy on Vercel

### Automatic Deployment

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Next.js project
3. Set the following environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_BASE_URL`: https://joining-dots-backend-eta.vercel.app/api

### Manual Deployment

1. Install the Vercel CLI:
   ```bash
   pnpm install -g vercel
   ```
2. Login to Vercel:
   ```bash
   vercel login
   ```
3. Deploy the project:
   ```bash
   vercel
   ```

### Important Notes for Vercel Deployment

- The project includes a `vercel.json` configuration file that sets up:
  - Build commands using pnpm
  - API rewrites to the backend
  - Security headers
  - Environment variables
- Make sure to set the environment variables in the Vercel dashboard
- The `.env.production` file is included for reference but Vercel will use the environment variables set in the dashboard
>>>>>>> 79e13a7 (Initial commit)

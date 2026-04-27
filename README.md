# FINCOACH Frontend

A modern React + Vite frontend application for financial coaching powered by AI.

## Features

- **User Authentication**: Phone number login with OTP verification
- **Onboarding**: Personalized setup for financial goals
- **Dashboard**: Overview of financial health, budget tracking, spending breakdown
- **Accounts Management**: Add, edit, delete bank and cash accounts with persisted balances
- **Transfers**: Transfer money between bank and cash accounts
- **PDF Export**: Export filtered financial reports as PDF
- **Backend API**: Dependency-free Node API with JSON persistence
- **Responsive Design**: Works on desktop and mobile devices
- **AI Coach**: Placeholder for future AI integration

## Tech Stack

- **React 18.3.1**: UI library
- **Vite 4.5.0**: Build tool and dev server
- **@vitejs/plugin-react 4.0.0**: React plugin for Vite
- **jsPDF**: PDF generation
- **html2canvas**: HTML to image conversion
- **DOMPurify**: HTML sanitization

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run server
   ```

3. In a second terminal, run the frontend:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173/index.html](http://localhost:5173/index.html) in your browser.

## Project Structure

- `index.html` - App entry HTML
- `src/main.jsx` - React entry point
- `src/App.jsx` - Main app component with all pages
- `src/FinCoachAI.jsx` - Placeholder for AI features
- `src/styles.css` - Global styles
- `server.mjs` - Backend API for accounts, transfers, reports data, and phone validation
- `data/fincoach-db.json` - Local JSON database used by the backend
- `vite.config.js` - Vite configuration
- `package.json` - Dependencies and scripts

## Pages

- **Login**: Phone authentication
- **Onboarding**: User setup
- **Dashboard**: Financial overview
- **Accounts**: Account management
- **AI Coach**: AI-powered advice (placeholder)
- **Goals**: Financial goals tracking
- **Calculator**: Financial calculations
- **Community**: User community
- **Videos**: Educational content
- **Testimonials**: User reviews

## Development

- Use `npm run build` to build for production
- Use `npm run preview` to preview the production build

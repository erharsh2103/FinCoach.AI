# FINCOACH - Financial Coaching Application

A modern React + Vite frontend with Node.js backend for financial coaching and management, powered by AI.

## Features

- **User Authentication**: Phone number login with OTP verification via Firebase
- **Financial Management**: Track accounts, transactions, goals, and bills
- **AI Coaching**: Integrated AI recommendations and financial guidance
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Plan Management**: Free, Pro, and Elite subscription plans with Razorpay integration
- **PDF Export**: Export financial reports as PDF documents
- **Real-time Sync**: Backend API with MongoDB persistence

## Tech Stack

### Frontend
- **React 18.3.1**: UI library
- **Vite 7.3.3**: Build tool and dev server
- **Firebase**: Authentication
- **jsPDF & html2canvas**: PDF generation

### Backend
- **Node.js 20.x**: Runtime
- **Express 4.22.1**: Web framework
- **MongoDB 8.9.5**: Database
- **Razorpay**: Payment processing
- **Nodemon**: Development server with auto-reload

## Project Structure

```
├── src/                      # Frontend source
│   ├── api/                 # API client functions
│   ├── components/          # React components
│   │   ├── auth/           # Authentication flows
│   │   ├── common/         # Shared UI components
│   │   ├── modals/         # Modal dialogs
│   │   └── widgets/        # Feature widgets
│   ├── App.jsx             # Main app component
│   ├── firebase.js         # Firebase config
│   └── styles.css          # Global styles
├── backend/                 # Backend source
│   ├── src/
│   │   ├── app.js          # Express app setup
│   │   ├── server.js       # Server entry point
│   │   ├── bootstrap.js    # Database initialization
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── constants/      # Constants and seed data
│   │   └── utils/          # Helper functions
├── scripts/
│   └── dev-all.mjs         # Development script (both servers)
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
└── .env                    # Environment variables
```

## Setup Instructions

### Prerequisites

- **Node.js 20.x** or higher
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` (or set `MONGODB_URI` in `.env`)
- **npm** package manager

### Installation

1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   npm --prefix backend install
   ```

3. **Configure Environment Variables**
   
   The `.env` file is already created with default values. You can customize:
   ```env
   # Frontend
   VITE_API_BASE_URL=              # Leave empty to use /api proxy
   VITE_FIREBASE_API_KEY=          # Firebase config
   VITE_FIREBASE_PROJECT_ID=       # Firebase project ID
   
   # Backend
   PORT=4000                       # Backend server port
   MONGODB_URI=mongodb://127.0.0.1:27017/fincoach
   CLIENT_URL=http://127.0.0.1:5173
   RAZORPAY_KEY_ID=               # Optional: Razorpay API key
   RAZORPAY_KEY_SECRET=           # Optional: Razorpay secret
   ```

### Running the Application

#### Development Mode (Both Servers)

Start both frontend and backend servers with hot reload:

```bash
npm run dev:all
```

This command:
- Starts Vite dev server on `http://localhost:5173`
- Starts Node backend with nodemon on `http://localhost:4000`
- Proxies API calls to backend

#### Frontend Only

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

#### Backend Only

```bash
npm --prefix backend run dev
```

Backend API will be available at `http://localhost:4000`

### Build for Production

```bash
npm run build
```

Generates optimized production build in `dist/` directory.

## API Documentation

### Authentication Endpoints

**Send OTP**
```
POST /api/auth/send-otp
Body: { phone: "9876543210" }
```

**Verify OTP & Login**
```
POST /api/auth/verify-otp
Body: { phone: "9876543210", otp: "123456" }
```

**Validate Phone**
```
POST /api/auth/validate-phone
Body: { phone: "9876543210" }
```

**Create Phone Session**
```
POST /api/auth/phone-session
Body: { phone: "9876543210" }
```

### Finance Endpoints

All finance endpoints require `x-session-token` header with auth token.

**Get Finance Data**
```
GET /api/finance
Response: { profile, accounts, transactions, goals, bills, totalBalance, ... }
```

**Update Profile**
```
PUT /api/profile
Body: { name, phone, email, city, age, incomeType, monthlyIncome, riskProfile, occupation, permissions }
```

**Create Transaction**
```
POST /api/transactions
Body: { type: "expense|income|transfer", amount, date, description, category, accountId, ... }
```

**Manage Goals**
```
POST /api/goals                    # Create goal
PUT  /api/goals/:id/fund          # Fund a goal
DELETE /api/goals/:id             # Delete goal
```

**Manage Bills**
```
POST /api/bills                    # Create bill
PUT  /api/bills/:id/pay           # Pay bill
DELETE /api/bills/:id             # Delete bill
```

**Manage Accounts**
```
POST /api/accounts                # Create account
PUT  /api/accounts/:id            # Update account
DELETE /api/accounts/:id          # Delete account
```

**Create Transfer**
```
POST /api/transfers
Body: { fromId, toId, amount }
```

### Payment Endpoints

All payment endpoints require authentication.

**Create Payment Order**
```
POST /api/payments/create-order
Body: { plan: "pro|elite" }
```

**Verify Payment**
```
POST /api/payments/verify
Body: { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature }
```

**Get Payment History**
```
GET /api/payments/history
```

## Frontend API Client

The frontend provides a centralized API client in `src/api/api.js`:

```javascript
import { 
  authApi, 
  financeApi, 
  paymentApi,
  setAuthToken,
  getAuthToken 
} from './src/api/api.js';

// Auth
await authApi.sendOtp("9876543210");
const { token } = await authApi.verifyOtp("9876543210", "123456");
setAuthToken(token);

// Finance
const finance = await financeApi.getFinance();
await financeApi.createTransaction({ type: "expense", ... });

// Payments
const order = await paymentApi.createPaymentOrder("pro");
```

## Authentication Flow

1. User enters phone number
2. OTP is sent (logged to console in dev mode)
3. User enters OTP
4. Backend creates session token
5. Token stored in localStorage as `fincoach_token`
6. All API requests include token in `x-session-token` header
7. Protected routes validate token via auth middleware

## Troubleshooting

### Backend Won't Start

**Error: "Could not connect to MongoDB"**
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- Or install MongoDB locally: [mongodb.com](https://www.mongodb.com/try/download/community)

**Error: "Port 4000 is already in use"**
- Change `PORT` in `.env`
- Or kill existing process: `lsof -ti:4000 | xargs kill -9`

### Frontend Won't Connect to Backend

**Error: "Could not reach the local /api proxy"**
- Ensure backend is running on port 4000
- Check `CLIENT_URL` matches your setup
- Verify no firewall blocking localhost connections

**CORS Errors**
- Ensure `CLIENT_URL` in backend `.env` matches frontend URL
- Should be `http://127.0.0.1:5173` for local development

### OTP Not Received (SMS)

Development mode shows OTP in backend logs. To use real SMS:
- Set `SMS_PROVIDER` in `.env` (not implemented yet)
- OTPs are logged to console during development

## Contributing

1. Create a feature branch
2. Make your changes
3. Test both frontend and backend
4. Submit a pull request

## License

Private - FinCoach Application

## Support

For issues or questions, check the troubleshooting section or review API documentation above.

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

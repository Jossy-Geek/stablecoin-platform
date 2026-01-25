# User Frontend 1

A new user frontend built from scratch using the admin-frontend layout and UI design.

## Features

- Exact layout and UI design from admin-frontend
- Left sidebar navigation with: Dashboard, Wallet, Transactions, Settings
- Uses existing APIs from user-frontend
- Responsive design with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TRANSACTION_API_URL=http://localhost:3003
NEXT_PUBLIC_IS_CAPTCHA=false
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

3. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3006`

## Pages

- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard with balance and recent transactions
- `/wallet` - Wallet management (deposit/withdraw)
- `/transactions` - Transaction history with filters
- `/settings` - User settings and 2FA setup

## API Endpoints Used

- `GET /users/me` - Get current user
- `GET /transactions/balance` - Get user balance
- `GET /wallet/info` - Get wallet information
- `GET /wallet/transactions` - Get user transactions
- `POST /wallet/deposit` - Create deposit transaction
- `POST /wallet/withdraw` - Create withdraw transaction
- `POST /auth/setup-2fa` - Setup 2FA
- `POST /auth/enable-2fa` - Enable 2FA

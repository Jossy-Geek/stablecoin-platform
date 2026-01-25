# Notification Service

Notification service for sending email notifications via RabbitMQ queue using SMTP.

## 🏗️ Architecture

### Modular Structure

```
notification-service/
├── src/
│   ├── shared/              # Shared modules (used across all modules)
│   │   └── rabbitmq/       # RabbitMQ integration
│   └── modules/            # Main business logic modules
│       └── notification/   # Notification operations
│           └── templates/  # Email templates
```

## 🔑 Key Features

- ✅ RabbitMQ email queue consumption
- ✅ Email sending via nodemailer (SMTP)
- ✅ Transaction event email notifications (pending, confirmed, rejected)
- ✅ Beautiful HTML email templates
- ✅ Graceful error handling (email failures don't break the app)
- ✅ Modular architecture

## 📁 Folder Structure

### Shared Modules (`src/shared/`)
All shared functionality that can be used across multiple modules:

- **rabbitmq/** - RabbitMQ client and service for message queuing

### Main Modules (`src/modules/`)
Business logic modules:

- **notification/** - Email notification operations
  - **templates/** - Email template generators for transaction events

## 🔧 Environment Variables

See `env.example` for all configuration options.

### Required SMTP Configuration

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

## 🚀 Usage

```bash
# Install dependencies
npm install

# Start development
npm run start:dev

# Build
npm run build

# Start production
npm run start:prod
```

## 📧 Email Notifications

### Transaction Event Emails

The service automatically sends emails when transaction events are published to RabbitMQ:

- **Pending**: When a transaction is created and awaiting approval
- **Confirmed**: When a transaction is approved and confirmed
- **Rejected**: When a transaction is rejected

### Publishing Transaction Events

To send transaction emails, publish events to the `transaction-events` queue:

```typescript
// Example: Publishing a transaction pending event
await rabbitMQService.publish('transaction-events', {
  transactionId: 'tx-123',
  userId: 'user-456',
  userEmail: 'user@example.com', // Required for email delivery
  amount: '100.00',
  currency: 'USD',
  transactionType: 'deposit',
  status: 'pending',
  timestamp: new Date().toISOString(),
});
```

### Generic Email Notifications

You can also send generic emails via the `email-notifications` queue:

```typescript
await rabbitMQService.publish('email-notifications', {
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to our platform!</h1>',
  // OR use a template
  template: 'transaction-confirmed',
  data: {
    transactionId: 'tx-123',
    amount: '100.00',
    transactionType: 'deposit',
  },
});
```

## 🧪 Testing with YOPMAIL

YOPMAIL is a free disposable email service perfect for testing. Follow these steps:

### Step 1: Get a YOPMAIL Address

1. Go to [https://yopmail.com](https://yopmail.com)
2. Enter any username (e.g., `testuser`)
3. Click "Check Inbox"
4. Your email address is: `testuser@yopmail.com`

### Step 2: Configure SMTP

For testing, you can use:

#### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Configure `.env`**:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

#### Option B: Mailtrap (Free Testing Service)

1. Sign up at [Mailtrap.io](https://mailtrap.io) (free tier available)
2. Get your SMTP credentials from the inbox
3. **Configure `.env`**:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@stablecoin.com
```

#### Option C: Ethereal Email (Auto-generated Test Credentials)

1. Visit [Ethereal Email](https://ethereal.email/)
2. Click "Create Account" to generate test credentials
3. Use the provided SMTP settings

### Step 3: Test Email Sending

#### Method 1: Using RabbitMQ Publisher

Create a test script or use a RabbitMQ management tool to publish a test event:

```bash
# Using RabbitMQ Management UI (http://localhost:15672)
# Publish to queue: transaction-events
# Message:
{
  "transactionId": "test-tx-001",
  "userId": "test-user-001",
  "userEmail": "testuser@yopmail.com",
  "amount": "100.00",
  "currency": "USD",
  "transactionType": "deposit",
  "status": "pending",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Method 2: Using Node.js Script

Create a test file `test-email.js`:

```javascript
const amqp = require('amqplib');

async function testEmail() {
  const connection = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const channel = await connection.createChannel();
  
  await channel.assertQueue('transaction-events', { durable: true });
  
  const message = {
    transactionId: 'test-tx-001',
    userId: 'test-user-001',
    userEmail: 'testuser@yopmail.com', // Your YOPMAIL address
    amount: '100.00',
    currency: 'USD',
    transactionType: 'deposit',
    status: 'pending',
    timestamp: new Date().toISOString(),
  };
  
  channel.sendToQueue('transaction-events', Buffer.from(JSON.stringify(message)));
  console.log('✅ Test email event published!');
  
  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 1000);
}

testEmail().catch(console.error);
```

Run it:
```bash
node test-email.js
```

### Step 4: Check YOPMAIL Inbox

1. Go back to [YOPMAIL](https://yopmail.com)
2. Enter your username (e.g., `testuser`)
3. Click "Check Inbox"
4. You should see the email notification!

### Step 5: Test Different Transaction Statuses

Test all three email types:

**Pending Email:**
```json
{
  "transactionId": "test-tx-002",
  "userEmail": "testuser@yopmail.com",
  "amount": "50.00",
  "transactionType": "withdraw",
  "status": "pending"
}
```

**Confirmed Email:**
```json
{
  "transactionId": "test-tx-003",
  "userEmail": "testuser@yopmail.com",
  "amount": "200.00",
  "transactionType": "mint",
  "status": "confirmed",
  "txHash": "0x1234567890abcdef"
}
```

**Rejected Email:**
```json
{
  "transactionId": "test-tx-004",
  "userEmail": "testuser@yopmail.com",
  "amount": "75.00",
  "transactionType": "burn",
  "status": "rejected",
  "reason": "Insufficient balance"
}
```

## 🔍 Troubleshooting

### Email Not Sending

1. **Check SMTP Configuration**:
   - Verify all SMTP environment variables are set
   - Check logs for SMTP connection errors

2. **Verify SMTP Connection**:
   - On service startup, you should see: `✅ SMTP connection verified successfully`
   - If you see errors, check your SMTP credentials

3. **Check RabbitMQ**:
   - Ensure RabbitMQ is running
   - Verify messages are being consumed (check logs)

4. **Check Email Service Status**:
   - Look for: `⚠️ Email sending is disabled` warnings
   - This means SMTP is not properly configured

### Common SMTP Errors

- **"Invalid login"**: Check `SMTP_USER` and `SMTP_PASSWORD`
- **"Connection timeout"**: Check `SMTP_HOST` and `SMTP_PORT`
- **"Authentication failed"**: For Gmail, ensure you're using an App Password, not your regular password

## 📝 Import Examples

### Using Notification Service

```typescript
import { NotificationService } from './modules/notification/notification.service';

// Send transaction email
await notificationService.sendTransactionPendingEmail(transactionData, userEmail);
```

### Using RabbitMQ Service

```typescript
import { RabbitMQService } from './shared/rabbitmq/rabbitmq.service';

// Publish transaction event
await rabbitMQService.publish('transaction-events', eventData);
```

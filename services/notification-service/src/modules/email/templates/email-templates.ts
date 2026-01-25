/**
 * Email templates for transaction notifications
 */

export interface TransactionEmailData {
  transactionId: string;
  userId: string;
  amount: string;
  currency?: string;
  transactionType: 'deposit' | 'withdraw' | 'mint' | 'burn';
  status: 'pending' | 'confirmed' | 'rejected';
  txHash?: string;
  reason?: string;
  timestamp?: string;
}

/**
 * Generate HTML email template for transaction pending
 */
export function generateTransactionPendingEmail(data: TransactionEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction Pending</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #ff9800; margin-top: 0;">Transaction Pending Approval</h2>
        <p>Your transaction is pending admin approval.</p>
      </div>
      
      <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 40%;">Transaction ID:</td>
            <td style="padding: 8px 0;">${data.transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Type:</td>
            <td style="padding: 8px 0; text-transform: capitalize;">${data.transactionType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
            <td style="padding: 8px 0;">${data.amount} ${data.currency || 'USD'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Status:</td>
            <td style="padding: 8px 0; color: #ff9800; font-weight: bold;">PENDING</td>
          </tr>
          ${data.timestamp ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Date:</td>
            <td style="padding: 8px 0;">${new Date(data.timestamp).toLocaleString()}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0; color: #856404;">
          <strong>Note:</strong> Your transaction is being reviewed by our team. You will receive another email once it has been processed.
        </p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated email. Please do not reply.</p>
        <p>&copy; ${new Date().getFullYear()} Stablecoin Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML email template for transaction confirmed
 */
export function generateTransactionConfirmedEmail(data: TransactionEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
        <h2 style="color: #155724; margin-top: 0;">✓ Transaction Confirmed</h2>
        <p style="color: #155724; margin-bottom: 0;">Your transaction has been successfully confirmed and processed.</p>
      </div>
      
      <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 40%;">Transaction ID:</td>
            <td style="padding: 8px 0;">${data.transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Type:</td>
            <td style="padding: 8px 0; text-transform: capitalize;">${data.transactionType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
            <td style="padding: 8px 0;">${data.amount} ${data.currency || 'USD'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Status:</td>
            <td style="padding: 8px 0; color: #28a745; font-weight: bold;">CONFIRMED</td>
          </tr>
          ${data.txHash ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Transaction Hash:</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 12px; word-break: break-all;">${data.txHash}</td>
          </tr>
          ` : ''}
          ${data.timestamp ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Date:</td>
            <td style="padding: 8px 0;">${new Date(data.timestamp).toLocaleString()}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
        <p style="margin: 0; color: #0c5460;">
          <strong>Transaction Details:</strong> Your ${data.transactionType} transaction has been successfully processed. The funds have been ${data.transactionType === 'deposit' || data.transactionType === 'mint' ? 'credited' : 'debited'} to your account.
        </p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated email. Please do not reply.</p>
        <p>&copy; ${new Date().getFullYear()} Stablecoin Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML email template for transaction rejected
 */
export function generateTransactionRejectedEmail(data: TransactionEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction Rejected</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
        <h2 style="color: #721c24; margin-top: 0;">✗ Transaction Rejected</h2>
        <p style="color: #721c24; margin-bottom: 0;">Your transaction has been rejected.</p>
      </div>
      
      <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 40%;">Transaction ID:</td>
            <td style="padding: 8px 0;">${data.transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Type:</td>
            <td style="padding: 8px 0; text-transform: capitalize;">${data.transactionType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
            <td style="padding: 8px 0;">${data.amount} ${data.currency || 'USD'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Status:</td>
            <td style="padding: 8px 0; color: #dc3545; font-weight: bold;">REJECTED</td>
          </tr>
          ${data.timestamp ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Date:</td>
            <td style="padding: 8px 0;">${new Date(data.timestamp).toLocaleString()}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      ${data.reason ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0; color: #856404;">
          <strong>Reason:</strong> ${data.reason}
        </p>
      </div>
      ` : ''}
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
        <p style="margin: 0; color: #721c24;">
          <strong>What's Next?</strong> If you believe this is an error, please contact our support team with your transaction ID for assistance.
        </p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated email. Please do not reply.</p>
        <p>&copy; ${new Date().getFullYear()} Stablecoin Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get email subject for transaction event
 */
export function getTransactionEmailSubject(
  transactionType: string,
  status: 'pending' | 'confirmed' | 'rejected',
): string {
  const typeLabels: Record<string, string> = {
    deposit: 'Deposit',
    withdraw: 'Withdrawal',
    mint: 'Mint',
    burn: 'Burn',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending Approval',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
  };

  const typeLabel = typeLabels[transactionType] || transactionType;
  const statusLabel = statusLabels[status] || status;

  return `${typeLabel} Transaction ${statusLabel}`;
}

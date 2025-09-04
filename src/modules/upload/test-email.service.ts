import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { IAwsConfig } from '@/common/types/config';
import { AWS_CONFIG_KEY } from '@/config/keys.config';

@Injectable()
export class TestEmailService {
  private readonly logger = new Logger(TestEmailService.name);
  private readonly sesClient: SESClient;

  constructor(private readonly configService: ConfigService) {
    const awsConfig = this.configService.get<IAwsConfig>(AWS_CONFIG_KEY)!;

    this.sesClient = new SESClient({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
    });
  }

  async sendTestEmail(toEmail: string) {
    const command = new SendEmailCommand({
      Source: 'FeeNex<noreply@feenex.app>',
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: 'Feenex - Email Service Test',
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: 'FeeNex - Email Service Test\n\nHello!\n\nThis is a test email sent from the Feenex backend using AWS SES.\n\nIf you received this message, our email service is working perfectly!\n\nBest regards,\nThe Feenex Team',
            Charset: 'UTF-8',
          },
          Html: {
            Data: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Service Test</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f8fafc;
                  }
                  .container {
                    max-width: 600px;
                    background: white;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                  }
                  .header {
                    background: linear-gradient(135deg, #4F6B58 0%, #3a5142 100%);
                    padding: 40px 30px;
                    text-align: center;
                    color: white;
                  }
                  .logo {
                    font-size: 32px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    letter-spacing: -1px;
                  }
                  .tagline {
                    font-size: 16px;
                    opacity: 0.9;
                    margin-bottom: 20px;
                  }
                  .status-badge {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    backdrop-filter: blur(10px);
                  }
                  .content {
                    padding: 40px 30px;
                  }
                  .success-icon {
                    text-align: center;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .success-icon div {
                    width: 64px;
                    height: 64px;
                    background: #10b981;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    color: white;
                  }
                  .message {
                    text-align: center;
                    margin-bottom: 32px;
                  }
                  .message h2 {
                    font-size: 24px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 12px;
                  }
                  .message p {
                    font-size: 16px;
                    color: #6b7280;
                    line-height: 1.6;
                  }
                  .info-box {
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 24px;
                    margin-bottom: 32px;
                  }
                  .info-box h3 {
                    font-size: 16px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 12px;
                  }
                  .info-box ul {
                    list-style: none;
                  }
                  .info-box li {
                    padding: 4px 0;
                    font-size: 14px;
                    color: #6b7280;
                  }
                  .info-box li:before {
                    content: "✓";
                    color: #10b981;
                    font-weight: bold;
                    margin-right: 8px;
                  }
                  .footer {
                    background: #f9fafb;
                    padding: 24px 30px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                  }
                  .footer p {
                    font-size: 14px;
                    color: #9ca3af;
                    margin-bottom: 8px;
                  }
                  .footer .brand {
                    font-weight: 600;
                    color: #4F6B58;
                  }
                  .timestamp {
                    font-size: 12px;
                    color: #d1d5db;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="logo">FeeNex</div>
                    <div class="tagline">Track your expenses <strong>in seconds</strong>, not hours!</div>
                    <div class="status-badge">🚀 Email Service Test</div>
                  </div>
                  
                  <div class="content">
                    <div class="message">
                      <h2>Email Service Working!</h2>
                      <p>This test email confirms that our AWS SES integration is properly configured and ready for production use.</p>
                    </div>
                  </div>
                  
                  <div class="footer">
                    <p>Best regards,</p>
                    <p class="brand">FeeNex Development Team</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      const result = await this.sesClient.send(command);
      this.logger.log(
        `Test email sent successfully. MessageId: ${result.MessageId}`,
      );
    } catch (error) {
      this.logger.error('Failed to send test email', error);
      throw error;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { join } from 'path';
import { readFile } from 'fs/promises';
import {
  AWS_CONFIG_KEY,
  ENABLE_EMAIL_SERVICE_CONFIG_KEY,
} from '@/config/keys.config';
import { type IAwsConfig } from '@/common/types/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly enableEmailService: boolean;
  private readonly sesClient?: SESClient;
  private readonly sourceEmail: string;
  private readonly isDevelopment: boolean;
  private readonly sendGridApiKey: string;
  private readonly templatesPath = join(
    process.cwd(),
    'src',
    'modules',
    'email',
    'templates',
  );
  private templateCache: Map<string, string> = new Map();

  constructor(private readonly configService: ConfigService) {
    /* force true for now to use sendgrid */
    this.isDevelopment = true;

    if (this.isDevelopment) {
      this.sendGridApiKey = this.configService.get<string>(
        'SENDGRID_API_KEY',
        '',
      );
      this.sourceEmail = this.configService.get<string>(
        'SENDGRID_FROM_EMAIL',
        'noreply@feenex.com',
      );

      if (!this.sendGridApiKey) {
        this.logger.warn('SENDGRID_API_KEY not configured for development');
      }
    } else {
      const awsConfig = this.configService.get<IAwsConfig>(AWS_CONFIG_KEY)!;
      this.sesClient = new SESClient({
        region: awsConfig.region,
        credentials: awsConfig.credentials,
      });
      this.sourceEmail = awsConfig.ses.sourceEmail;
      this.sendGridApiKey = '';
    }

    this.enableEmailService = Boolean(
      Number(this.configService.get<string>(ENABLE_EMAIL_SERVICE_CONFIG_KEY)),
    );

    this.loadTemplates().catch((err) =>
      this.logger.error('Failed to load email templates', err),
    );
  }

  async sendWelcomeEmail(toEmail: string): Promise<void> {
    if (!this.enableEmailService) {
      this.logger.log('Email service disabled, skipping welcome email');
      return;
    }

    const htmlTemplate = await this.getTemplate('welcome', 'html');
    const txtTemplate = await this.getTemplate('welcome', 'txt');
    const subject = 'FeeNex - Welcome to FeeNex!';

    if (this.isDevelopment) {
      await this.sendEmailWithSendGridAPI(
        toEmail,
        subject,
        txtTemplate,
        htmlTemplate,
      );
    } else {
      await this.sendEmailWithSES(toEmail, subject, txtTemplate, htmlTemplate);
    }
  }

  async sendInviteEmail(
    toEmail: string,
    orgName: string,
    inviteLink: string,
  ): Promise<void> {
    if (!this.enableEmailService) {
      this.logger.log('Email service disabled, skipping invite email');
      return;
    }

    if (!toEmail || !orgName || !inviteLink) {
      this.logger.warn('Missing required parameters for invite email: ', {
        toEmail,
        orgName,
        inviteLink,
      });
      return;
    }

    const htmlTemplate = await this.getTemplate('invite', 'html');
    const txtTemplate = await this.getTemplate('invite', 'txt');
    const subject = `FeeNex - Invitation to join ${orgName}`;

    const html = this.replaceVariables(htmlTemplate, { orgName, inviteLink });
    const plainText = this.replaceVariables(txtTemplate, {
      orgName,
      inviteLink,
    });

    if (this.isDevelopment) {
      await this.sendEmailWithSendGridAPI(toEmail, subject, plainText, html);
    } else {
      await this.sendEmailWithSES(toEmail, subject, plainText, html);
    }
  }

  async sendResetPasswordEmail(
    toEmail: string,
    resetLink: string,
  ): Promise<void> {
    if (!this.enableEmailService) {
      this.logger.log('Email service disabled, skipping reset password email');
      return;
    }

    if (!resetLink || !toEmail) {
      this.logger.warn(
        'Missing required parameters for reset password email: ',
        {
          toEmail,
          resetLink,
        },
      );
      return;
    }

    const htmlTemplate = await this.getTemplate('reset-password', 'html');
    const txtTemplate = await this.getTemplate('reset-password', 'txt');
    const subject = 'FeeNex - Reset Your Password';

    const html = this.replaceVariables(htmlTemplate, { resetLink });
    const plainText = this.replaceVariables(txtTemplate, { resetLink });

    if (this.isDevelopment) {
      await this.sendEmailWithSendGridAPI(toEmail, subject, plainText, html);
    } else {
      await this.sendEmailWithSES(toEmail, subject, plainText, html);
    }
  }

  private async sendEmailWithSendGridAPI(
    toEmail: string,
    subject: string,
    plainText: string,
    html: string,
  ): Promise<void> {
    if (!this.sendGridApiKey) {
      this.logger.error('SendGrid API key not configured');
      throw new Error('SendGrid API key not configured');
    }

    const payload = {
      personalizations: [
        {
          to: [{ email: toEmail }],
        },
      ],
      from: { email: this.sourceEmail },
      subject,
      content: [
        {
          type: 'text/plain',
          value: plainText,
        },
        {
          type: 'text/html',
          value: html,
        },
      ],
    };

    this.logger.log(`Attempting to send email to ${toEmail} via SendGrid API`);

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `SendGrid API error: ${response.status} - ${errorText}`,
        );
        throw new Error(
          `SendGrid API error: ${response.status} - ${errorText}`,
        );
      }

      this.logger.log(
        `✅ Email successfully sent to ${toEmail} via SendGrid API. Status: ${response.status}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send email to ${toEmail} via SendGrid API:`,
        error,
      );
      throw error;
    }
  }

  private async sendEmailWithSES(
    toEmail: string,
    subject: string,
    plainText: string,
    html: string,
  ): Promise<void> {
    if (!this.sesClient) {
      throw new Error(
        'AWS SES client not initialized for production environment',
      );
    }

    const command = new SendEmailCommand({
      Source: this.sourceEmail,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: plainText,
            Charset: 'UTF-8',
          },
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const result = await this.sesClient.send(command);
    this.logger.log(
      `Email sent to ${toEmail} via AWS SES. MessageId: ${result.MessageId}`,
    );
  }

  async getTemplate(
    templateName: string,
    type: 'html' | 'txt',
  ): Promise<string> {
    const cacheKey = `${templateName}.${type}`;

    const cached = this.templateCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const filePath = join(
      this.templatesPath,
      templateName,
      `${templateName}.${type}`,
    );

    const template = await readFile(filePath, 'utf-8');
    this.templateCache.set(cacheKey, template);

    return template;
  }

  private async loadTemplates(): Promise<void> {
    const templates = [
      { name: 'welcome', types: ['html', 'txt'] },
      { name: 'invite', types: ['html', 'txt'] },
      { name: 'reset-password', types: ['html', 'txt'] },
    ];

    for (const { name, types } of templates) {
      for (const type of types) {
        try {
          await this.getTemplate(name, type as 'html' | 'txt');
        } catch {
          this.logger.warn(`Failed to preload template ${name}.${type}`);
        }
      }
    }
  }

  replaceVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key as keyof Record<string, string>] || match;
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as nodemailer from 'nodemailer';
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
  private readonly nodeMailerTransporter?: nodemailer.Transporter;
  private readonly sourceEmail: string;
  private readonly isDevelopment: boolean;
  private readonly templatesPath = join(
    process.cwd(),
    'src',
    'modules',
    'email',
    'templates',
  );
  private templateCache: Map<string, string> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';

    if (this.isDevelopment) {
      this.nodeMailerTransporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: this.configService.get<string>('SENDGRID_API_KEY'),
        },
      }) as nodemailer.Transporter;
      this.sourceEmail = this.configService.get<string>(
        'SENDGRID_FROM_EMAIL',
        'noreply@feenex.com',
      );
    } else {
      const awsConfig = this.configService.get<IAwsConfig>(AWS_CONFIG_KEY)!;
      this.sesClient = new SESClient({
        region: awsConfig.region,
        credentials: awsConfig.credentials,
      });
      this.sourceEmail = awsConfig.ses.sourceEmail;
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
      return;
    }

    const htmlTemplate = await this.getTemplate('welcome', 'html');
    const txtTemplate = await this.getTemplate('welcome', 'txt');
    const subject = 'FeeNex - Welcome to FeeNex!';

    if (this.isDevelopment) {
      await this.sendEmailWithNodemailer(
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
      await this.sendEmailWithNodemailer(toEmail, subject, plainText, html);
    } else {
      await this.sendEmailWithSES(toEmail, subject, plainText, html);
    }
  }

  async sendResetPasswordEmail(
    toEmail: string,
    resetLink: string,
  ): Promise<void> {
    if (!this.enableEmailService) {
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
      await this.sendEmailWithNodemailer(toEmail, subject, plainText, html);
    } else {
      await this.sendEmailWithSES(toEmail, subject, plainText, html);
    }
  }

  private async sendEmailWithNodemailer(
    toEmail: string,
    subject: string,
    plainText: string,
    html: string,
  ): Promise<void> {
    if (!this.nodeMailerTransporter) {
      throw new Error(
        'Nodemailer transporter not initialized for development environment',
      );
    }

    const mailOptions = {
      from: this.sourceEmail,
      to: toEmail,
      subject,
      text: plainText,
      html,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await this.nodeMailerTransporter.sendMail(mailOptions);
      this.logger.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Email sent to ${toEmail} via SendGrid. MessageId: ${result.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${toEmail} via SendGrid:`,
        error,
      );
      throw error;
    }
  }

  // Existing SES method (unchanged)
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

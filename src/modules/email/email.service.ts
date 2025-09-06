import { REQUEST } from '@nestjs/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { AWS_CONFIG_KEY } from '@/config/keys.config';
import { type IAwsConfig } from '@/common/types/config';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESClient;
  private readonly sourceEmail: string;
  private readonly templatesPath = join(
    process.cwd(),
    'src',
    'modules',
    'email',
    'templates',
  );

  constructor(
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: IAuthenticatedRequest,
  ) {
    const awsConfig = this.configService.get<IAwsConfig>(AWS_CONFIG_KEY)!;

    this.sesClient = new SESClient({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
    });

    this.sourceEmail = awsConfig.ses.sourceEmail;
  }

  async sendWelcomeEmail(toEmail: string) {
    const htmlTemplate = await this.getTemplate('welcome', 'html');
    const txtTemplate = await this.getTemplate('welcome', 'txt');

    const subject = 'FeeNex - Welcome to FeeNex!';
    const html = htmlTemplate;
    const plainText = txtTemplate;

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

    try {
      const result = await this.sesClient.send(command);
      this.logger.log(
        `Welcome email sent to ${toEmail}. MessageId: ${result.MessageId}`,
      );
    } catch (error) {
      this.logEmailEvent('Welcome email failed', {
        toEmail,
        error: this.formatError(error),
        recipientName: toEmail,
      });
      throw error;
    }
  }

  async sendInviteEmail(toEmail: string, orgName: string, inviteLink: string) {
    const htmlTemplate = await this.getTemplate('invite', 'html');
    const txtTemplate = await this.getTemplate('invite', 'txt');

    const subject = `FeeNex - Invitation to join ${orgName}`;
    const html = this.replaceVariables(htmlTemplate, { orgName, inviteLink });
    const plainText = this.replaceVariables(txtTemplate, {
      orgName,
      inviteLink,
    });

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

    try {
      const result = await this.sesClient.send(command);
      this.logger.log(
        `Invite email sent to ${toEmail}. MessageId: ${result.MessageId}`,
      );
    } catch (error) {
      this.logEmailEvent('Invite email failed', {
        toEmail,
        error: this.formatError(error),
        recipientName: toEmail,
      });
      throw error;
    }
  }

  async getTemplate(
    templateName: string,
    type: 'html' | 'txt',
  ): Promise<string> {
    const filePath = join(
      this.templatesPath,
      templateName,
      `${templateName}.${type}`,
    );
    return await readFile(filePath, 'utf-8');
  }

  replaceVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key as keyof Record<string, string>] || match;
    });
  }

  private logEmailEvent(
    event: string,
    additionalData?: Record<string, any>,
  ): void {
    const request = this.request;

    this.logger.error({
      log: event,
      route: request.url,
      userId: request.user?.sub || 'unknown',
      userEmail: request.user?.email || 'unknown',
      userRole: request.user?.role?.name || 'unknown',
      userOrg: request.user?.organization?.id || 'unknown',
      method: request.method,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
  }

  private formatError(error: unknown): Record<string, any> {
    return {
      name:
        typeof error === 'object' && error !== null && 'name' in error
          ? (error as { name?: unknown }).name
          : undefined,
      message:
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: unknown }).message
          : undefined,
      status:
        typeof error === 'object' && error !== null && '$metadata' in error
          ? (error as { $metadata?: { httpStatusCode?: unknown } }).$metadata
              ?.httpStatusCode
          : undefined,
    };
  }
}

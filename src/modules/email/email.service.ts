import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { AWS_CONFIG_KEY } from '@/config/keys.config';
import { type IAwsConfig } from '@/common/types/config';

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

  constructor(private readonly configService: ConfigService) {
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

    const result = await this.sesClient.send(command);
    this.logger.log(
      `Welcome email sent to ${toEmail}. MessageId: ${result.MessageId}`,
    );
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

    const result = await this.sesClient.send(command);
    this.logger.log(
      `Invite email sent to ${toEmail}. MessageId: ${result.MessageId}`,
    );
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
}

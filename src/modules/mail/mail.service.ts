import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const mailHost = this.configService.get<string>('mail.host');
    const mailUser = this.configService.get<string>('mail.user');

    if (!mailHost || !mailUser) {
      this.logger.warn(
        'Mail configuration is incomplete (MAIL_HOST or MAIL_USER missing). ' +
          'Email sending will fail until these are configured.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: mailHost,
      port: this.configService.get<number>('mail.port'),
      secure: false,
      auth: {
        user: mailUser,
        pass: this.configService.get<string>('mail.pass'),
      },
    });
  }

  async sendActivationEmail(email: string, token: string): Promise<void> {
    const appUrl =
      this.configService.get<string>('appUrl') ?? 'http://localhost:3000';
    const activationUrl = `${appUrl}/api/auth/activate/${token}`;

    try {
      await this.transporter.sendMail({
        from: `"SkillHub Academy" <${this.configService.get<string>('mail.user')}>`,
        to: email,
        subject: 'Activate your SkillHub Academy account',
        html: `
          <h2>Welcome to SkillHub Academy!</h2>
          <p>Please click the link below to activate your account:</p>
          <a href="${activationUrl}">${activationUrl}</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send activation email to ${email}: ${message}`,
      );
    }
  }

  async sendLoginNotification(
    email: string,
    fullName: string,
  ): Promise<void> {
    const now = new Date().toLocaleString('uz-UZ', {
      timeZone: 'Asia/Tashkent',
    });
    try {
      await this.transporter.sendMail({
        from: `"SkillHub Academy" <${this.configService.get<string>('mail.user')}>`,
        to: email,
        subject: 'SkillHub Academy — Hisobingizga kirish amalga oshirildi',
        html: `
          <h2>Salom, ${fullName}!</h2>
          <p>Hisobingizga muvaffaqiyatli kirildi.</p>
          <p><strong>Vaqt:</strong> ${now}</p>
          <p>Agar bu siz bo'lmasangiz, darhol parolingizni o'zgartiring.</p>
          <br/>
          <p>Hurmat bilan,<br/>SkillHub Academy jamoasi</p>
        `,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send login notification to ${email}: ${message}`,
      );
    }
  }

  async sendScoreNotification(
    email: string,
    assignmentTitle: string,
    score: number,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"SkillHub Academy" <${this.configService.get<string>('mail.user')}>`,
        to: email,
        subject: `Your submission has been graded: ${assignmentTitle}`,
        html: `
          <h2>Submission Graded</h2>
          <p>Your submission for <strong>${assignmentTitle}</strong> has been graded.</p>
          <p>Score: <strong>${score}/100</strong></p>
        `,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send score notification to ${email}: ${message}`,
      );
    }
  }
}

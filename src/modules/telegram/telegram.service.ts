import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Telegraf, Context } from 'telegraf';
import { Op } from 'sequelize';
import { User } from '../users/models/user.model';
import { Enrollment } from '../enrollments/models/enrollment.model';
import { Course } from '../courses/models/course.model';
import { Assignment } from '../assignments/models/assignment.model';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Enrollment)
    private readonly enrollmentModel: typeof Enrollment,
    @InjectModel(Assignment)
    private readonly assignmentModel: typeof Assignment,
  ) {
    const token = this.configService.get<string>('telegram.botToken');
    if (token && token !== 'your_telegram_bot_token') {
      this.bot = new Telegraf(token);
    }
  }

  onModuleInit() {
    if (!this.bot) {
      this.logger.warn(
        'Telegram bot token not configured. Bot will not start.',
      );
      return;
    }

    this.bot.start((ctx) => this.handleStart(ctx));
    this.bot.command('profile', (ctx) => this.handleProfile(ctx));
    this.bot.command('mycourses', (ctx) => this.handleMyCourses(ctx));
    this.bot.command('reminders', (ctx) => this.handleReminders(ctx));
    this.bot.command('link', (ctx) => this.handleLink(ctx));

    this.bot.launch().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to launch Telegram bot: ${message}`);
    });

    this.logger.log('Telegram bot started');
  }

  onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGTERM');
      this.logger.log('Telegram bot stopped gracefully');
    }
  }

  private async handleStart(ctx: Context) {
    if (!ctx.from) return;

    await ctx.reply(
      `👋 Welcome to SkillHub Academy Bot!\n\n` +
        `To link your Telegram account, use the /link command followed by your link token.\n` +
        `You can generate a link token from your profile settings on the platform.\n\n` +
        `Available commands:\n` +
        `/profile — View your profile\n` +
        `/mycourses — View your enrolled courses\n` +
        `/reminders — View upcoming assignment deadlines`,
    );
  }

  private async handleProfile(ctx: Context) {
    if (!ctx.from) return;
    const telegramId = String(ctx.from.id);
    const user = await this.userModel.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user) {
      await ctx.reply(
        '❌ Your Telegram account is not linked to any SkillHub Academy account.\n' +
          'Please link your account from the platform settings.',
      );
      return;
    }

    await ctx.reply(
      `👤 Your Profile:\n\n` +
        `Name: ${user.full_name}\n` +
        `Email: ${user.email}\n` +
        `Role: ${user.role}`,
    );
  }

  private async handleMyCourses(ctx: Context) {
    if (!ctx.from) return;
    const telegramId = String(ctx.from.id);
    const user = await this.userModel.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user) {
      await ctx.reply(
        '❌ Account not linked. Please link your Telegram account first.',
      );
      return;
    }

    if (user.role !== UserRole.STUDENT) {
      await ctx.reply('ℹ️ This command is only available for students.');
      return;
    }

    const enrollments = await this.enrollmentModel.findAll({
      where: { student_id: user.id },
      include: [{ model: Course }],
    });

    if (enrollments.length === 0) {
      await ctx.reply('📚 You are not enrolled in any courses yet.');
      return;
    }

    // Guard against deleted courses
    const courseList = enrollments
      .filter((e) => e.course != null)
      .map((e, i) => `${i + 1}. ${e.course.title}`)
      .join('\n');

    if (!courseList) {
      await ctx.reply('📚 You are not enrolled in any active courses.');
      return;
    }

    await ctx.reply(`📚 Your Enrolled Courses:\n\n${courseList}`);
  }

  private async handleReminders(ctx: Context) {
    if (!ctx.from) return;
    const telegramId = String(ctx.from.id);
    const user = await this.userModel.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user) {
      await ctx.reply(
        '❌ Account not linked. Please link your Telegram account first.',
      );
      return;
    }

    if (user.role !== UserRole.STUDENT) {
      await ctx.reply('ℹ️ This command is only available for students.');
      return;
    }

    const enrollments = await this.enrollmentModel.findAll({
      where: { student_id: user.id },
    });

    const courseIds = enrollments.map((e) => e.course_id);

    if (courseIds.length === 0) {
      await ctx.reply(
        '📅 No upcoming deadlines. You are not enrolled in any courses.',
      );
      return;
    }

    const now = new Date();

    const assignments = await this.assignmentModel.findAll({
      where: {
        course_id: courseIds,
        deadline: { [Op.gt]: now },
      },
      include: [{ model: Course, as: 'course', attributes: ['title'] }],
      order: [['deadline', 'ASC']],
    });

    if (assignments.length === 0) {
      await ctx.reply('✅ No upcoming deadlines!');
      return;
    }

    const reminderList = assignments
      .map((a, i) => {
        const deadline = new Date(a.deadline).toLocaleString('uz-UZ');
        const courseTitle = a.course?.title ?? 'Unknown course';
        return `${i + 1}. ${a.title}\n   Course: ${courseTitle}\n   Deadline: ${deadline}`;
      })
      .join('\n\n');

    await ctx.reply(`⏰ Upcoming Deadlines:\n\n${reminderList}`);
  }

  async linkTelegramId(userId: number, telegramId: string): Promise<void> {
    await this.userModel.update(
      { telegram_id: telegramId },
      { where: { id: userId } },
    );
  }

  // In-memory link tokens: token -> { userId, expiresAt }
  private static linkTokens = new Map<string, { userId: number; expiresAt: number }>();

  generateLinkToken(userId: number): string {
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    TelegramService.linkTokens.set(token, {
      userId,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    return token;
  }

  private async handleLink(ctx: Context) {
    if (!ctx.from) return;
    const text = (ctx.message as { text?: string } | undefined)?.text ?? '';
    const parts = text.trim().split(/\s+/);
    const token = parts[1];

    if (!token) {
      await ctx.reply(
        '❌ Token kiritilmadi.\n' +
          'Foydalanish: /link TOKEN\n' +
          'Tokenni platformadagi profilingizdan oling.',
      );
      return;
    }

    const entry = TelegramService.linkTokens.get(token);
    if (!entry) {
      await ctx.reply('❌ Token noto\'g\'ri yoki muddati o\'tgan. Yangi token oling.');
      return;
    }
    if (Date.now() > entry.expiresAt) {
      TelegramService.linkTokens.delete(token);
      await ctx.reply('❌ Token muddati o\'tgan (15 daqiqa). Yangi token oling.');
      return;
    }

    const telegramId = String(ctx.from.id);
    // Check if already linked to another account
    const existing = await this.userModel.findOne({ where: { telegram_id: telegramId } });
    if (existing && existing.id !== entry.userId) {
      await ctx.reply('⚠️ Bu Telegram akkaunt boshqa foydalanuvchiga bog\'liq.');
      return;
    }

    await this.linkTelegramId(entry.userId, telegramId);
    TelegramService.linkTokens.delete(token);

    await ctx.reply(
      '✅ Telegram akkauntingiz muvaffaqiyatli bog\'landi!\n' +
        'Endi /profile, /mycourses va /reminders buyruqlaridan foydalanishingiz mumkin.',
    );
  }
}

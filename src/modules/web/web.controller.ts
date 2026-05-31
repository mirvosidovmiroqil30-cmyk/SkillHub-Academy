import {
  Body,
  Controller,
  Get,
  HttpException,
  Logger,
  Param,
  Post,
  Query,
  Render,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  CourseImageValidationPipe,
  SubmissionFileValidationPipe,
} from '../../common/pipes/file-validation.pipe';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from '../auth/dto/login.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { AssignmentsService } from '../assignments/assignments.service';
import { CategoriesService } from '../categories/categories.service';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { courseImageStorage } from '../courses/multer.config';
import { CoursesService } from '../courses/courses.service';
import { submissionFileStorage } from '../submissions/multer.config';
import { SubmissionsService } from '../submissions/submissions.service';
import { User } from '../users/models/user.model';
import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from '../users/users.service';

@Controller()
export class WebController {
  private readonly logger = new Logger(WebController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly coursesService: CoursesService,
    private readonly categoriesService: CategoriesService,
    private readonly assignmentsService: AssignmentsService,
    private readonly submissionsService: SubmissionsService,
    private readonly usersService: UsersService,
    private readonly telegramService: TelegramService,
  ) {}

  private withMessage(path: string, key: 'success' | 'error', value: string) {
    return `${path}?${key}=${encodeURIComponent(value)}`;
  }

  /** Extract a human-readable message from an HttpException response */
  private extractHttpMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'object' && response !== null) {
        const messageValue = (response as { message?: unknown }).message;
        if (Array.isArray(messageValue)) {
          return messageValue.join(', ');
        }
        if (typeof messageValue === 'string') {
          return messageValue;
        }
        return String(response);
      }
      return String(response || error.message);
    }
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  }

  @Public()
  @Get()
  @Render('home')
  home() {
    return {
      title: 'SkillHub Academy',
      page: 'home',
    };
  }

  @Public()
  @Get('courses')
  @Render('courses')
  async courses(
    @Query('category') category?: string,
    @Query('success') success?: string,
    @Query('error') error?: string,
    @CurrentUser() user?: User,
  ) {
    const categories = await this.categoriesService.findAll();
    const courses = await this.coursesService.findAll();
    const filteredCourses = category
      ? courses.filter((course) => course.category?.name === category)
      : courses;

    return {
      title: 'Courses',
      page: 'courses',
      userRole: user?.role,
      selectedCategory: category,
      categories,
      courses: filteredCourses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        image: course.image,
        teacher: course.teacher?.full_name ?? 'Unknown',
        category: course.category?.name,
      })),
      success,
      error,
    };
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  @Public()
  @Get('login')
  @Render('login')
  loginPage(
    @Query('error') error?: string | boolean,
    @Query('success') success?: string | boolean,
  ) {
    const normalize = (value?: string | boolean) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed && trimmed !== 'true' ? trimmed : undefined;
      }
      return undefined;
    };

    const normalizedError = normalize(error);
    const normalizedSuccess = normalize(success);

    return {
      title: 'Login',
      page: 'login',
      error: normalizedError,
      success: normalizedSuccess,
      showError: Boolean(normalizedError),
      showSuccess: Boolean(normalizedSuccess),
    };
  }

  @Public()
  @Post('login')
  async loginSubmit(@Body() dto: LoginDto, @Res() res: Response) {
    try {
      const { access_token, role } = await this.authService.login(dto);

      res.cookie('access_token', access_token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (role === UserRole.TEACHER) {
        return res.redirect('/teacher/courses');
      }
      if (role === UserRole.ADMIN) {
        return res.redirect('/admin/users');
      }

      // Student — redirect to dashboard
      return res.redirect('/dashboard');
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Login failed');
      return res.status(400).render('login', {
        title: 'Login',
        page: 'login',
        error: message,
        showError: true,
        email: dto.email,
      });
    }
  }

  @Public()
  @Get('register')
  @Render('register')
  registerPage(
    @Query('error') error?: string | boolean,
    @Query('success') success?: string | boolean,
  ) {
    const normalize = (value?: string | boolean) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed && trimmed !== 'true' ? trimmed : undefined;
      }
      return undefined;
    };

    const normalizedError = normalize(error);
    const normalizedSuccess = normalize(success);

    return {
      title: 'Register',
      page: 'register',
      error: normalizedError,
      success: normalizedSuccess,
      showError: Boolean(normalizedError),
      showSuccess: Boolean(normalizedSuccess),
    };
  }

  @Public()
  @Post('register')
  async registerSubmit(@Body() dto: RegisterDto, @Res() res: Response) {
    try {
      await this.authService.register(dto);
      return res.redirect(
        '/login?success=Account%20created.%20Please%20check%20your%20email%20and%20login.',
      );
    } catch (error: unknown) {
      // Use extractHttpMessage to preserve validation error details
      const message = this.extractHttpMessage(error, 'Registration failed');
      return res.redirect(`/register?error=${encodeURIComponent(message)}`);
    }
  }

  @Public()
  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return res.redirect('/login?success=Logged%20out%20successfully');
  }

  @Get('profile')
  @Render('profile')
  async profilePage(
    @CurrentUser() user: User,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ) {
    const linkToken = this.telegramService.generateLinkToken(user.id);
    return {
      title: 'Profil',
      page: 'profile',
      userName: user.full_name,
      email: user.email,
      role: user.role,
      telegramLinked: Boolean(user.telegram_id),
      telegramId: user.telegram_id,
      linkToken,
      success,
      error,
    };
  }

  @Post('courses/:id/enroll')
  @Roles(UserRole.STUDENT)
  async enrollCourse(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      await this.coursesService.enroll(id, user.id);
      return res.redirect(
        '/courses?success=Successfully%20enrolled%20to%20course',
      );
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Enrollment failed');
      return res.redirect(`/courses?error=${encodeURIComponent(message)}`);
    }
  }

  @Post('assignments/:id/submit')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file', { storage: submissionFileStorage }))
  async submitAssignment(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user: User,
    @UploadedFile(SubmissionFileValidationPipe) file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      await this.submissionsService.create(id, user.id, file);
      return res.redirect(
        this.withMessage('/dashboard', 'success', 'Assignment submitted'),
      );
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Submission failed');
      return res.redirect(this.withMessage('/dashboard', 'error', message));
    }
  }

  @Get('dashboard')
  @Roles(UserRole.STUDENT)
  @Render('student/dashboard')
  async studentDashboard(
    @CurrentUser() user: User,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ) {
    const myCourses = await this.coursesService.getMyEnrollments(user.id);
    const submissions = await this.submissionsService.findMySubmissions(
      user.id,
    );

    const assignmentGroups = await Promise.all(
      myCourses.map((course) =>
        this.assignmentsService.findByCourse(course.id),
      ),
    );
    const assignments = assignmentGroups.flat();
    const now = new Date();
    const upcomingAssignments = assignments.filter(
      (assignment) => new Date(assignment.deadline) > now,
    );

    return {
      title: 'Student Dashboard',
      page: 'student-dashboard',
      userName: user.full_name,
      stats: {
        courses: myCourses.length,
        assignments: assignments.length,
        submissions: submissions.length,
      },
      myCourses: myCourses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
      })),
      upcomingAssignments: upcomingAssignments
        .slice(0, 5)
        .map((assignment) => ({
          id: assignment.id,
          title: assignment.title,
          deadline: new Date(assignment.deadline).toLocaleString(),
        })),
      success,
      error,
    };
  }

  @Get('student/my-courses')
  @Roles(UserRole.STUDENT)
  @Render('student/mycourses')
  async studentMyCourses(@CurrentUser() user: User) {
    const myCourses = await this.coursesService.getMyEnrollments(user.id);

    return {
      title: 'My Courses',
      page: 'student-my-courses',
      userName: user.full_name,
      myCourses: myCourses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category?.name,
      })),
    };
  }

  @Get('student/assignments')
  @Roles(UserRole.STUDENT)
  @Render('student/assignments')
  async studentAssignments(
    @CurrentUser() user: User,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ) {
    const myCourses = await this.coursesService.getMyEnrollments(user.id);
    const assignmentGroups = await Promise.all(
      myCourses.map((course) =>
        this.assignmentsService.findByCourse(course.id),
      ),
    );
    const allAssignments = assignmentGroups.flat();
    const submissions = await this.submissionsService.findMySubmissions(user.id);
    const submittedIds = new Set(submissions.map((s) => s.assignment_id));

    const now = new Date();
    const SOON_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

    const assignments = allAssignments.map((assignment) => {
      const deadline = new Date(assignment.deadline);
      const isPast = deadline < now;
      const isSoon = !isPast && deadline.getTime() - now.getTime() < SOON_MS;
      const isSubmitted = submittedIds.has(assignment.id);
      const submission = submissions.find(
        (s) => s.assignment_id === assignment.id,
      );
      const course = myCourses.find((c) => c.id === assignment.course_id);

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        deadline: deadline.toLocaleString('uz-UZ'),
        courseName: course?.title ?? 'Noma\'lum kurs',
        isPast,
        isSoon,
        isSubmitted,
        score: submission?.score ?? null,
      };
    });

    const stats = {
      total: assignments.length,
      upcoming: assignments.filter((a) => !a.isPast && !a.isSubmitted).length,
      submitted: assignments.filter((a) => a.isSubmitted).length,
      expired: assignments.filter((a) => a.isPast && !a.isSubmitted).length,
    };

    return {
      title: 'Topshiriqlar',
      page: 'student-assignments',
      userName: user.full_name,
      assignments,
      stats,
      success,
      error,
    };
  }

  @Get('student/grades')
  @Roles(UserRole.STUDENT)
  @Render('student/grades')
  async studentGrades(@CurrentUser() user: User) {
    const submissions = await this.submissionsService.findMySubmissions(user.id);

    const gradedSubmissions = submissions.filter((s) => s.score !== null);
    const avgScore =
      gradedSubmissions.length > 0
        ? Math.round(
            gradedSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
              gradedSubmissions.length,
          )
        : 0;

    return {
      title: 'Baholar',
      page: 'student-grades',
      userName: user.full_name,
      submissions: submissions.map((s) => {
        const score = s.score;
        const hasScore = score !== null && score !== undefined;
        return {
          assignmentTitle: s.assignment?.title ?? '—',
          file: s.file,
          submittedAt: new Date(s.created_at).toLocaleString('uz-UZ'),
          hasScore,
          score,
          isHigh: hasScore && (score as number) >= 80,
          isMid: hasScore && (score as number) >= 50 && (score as number) < 80,
        };
      }),
      stats: {
        total: submissions.length,
        graded: gradedSubmissions.length,
        pending: submissions.length - gradedSubmissions.length,
        average: avgScore,
      },
    };
  }

  @Get('teacher/courses')
  @Roles(UserRole.TEACHER)
  @Render('teacher/courses')
  async teacherCourses(
    @CurrentUser() user: User,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ) {
    const categories = await this.categoriesService.findAll();
    const allCourses = await this.coursesService.findAll();
    const myCourses = allCourses.filter(
      (course) => course.teacher_id === user.id,
    );

    const assignmentsByCourse = await Promise.all(
      myCourses.map((course) =>
        this.assignmentsService.findByCourse(course.id),
      ),
    );
    const assignments = assignmentsByCourse.flat();

    return {
      title: 'Teacher Courses',
      page: 'teacher-courses',
      userName: user.full_name,
      categories,
      stats: {
        courses: myCourses.length,
        assignments: assignmentsByCourse.reduce(
          (total, list) => total + list.length,
          0,
        ),
      },
      myCourses: myCourses.map((course, index) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        image: course.image,
        category: course.category?.name,
        assignmentCount: assignmentsByCourse[index]?.length ?? 0,
      })),
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        course_id: assignment.course_id,
        courseName: myCourses.find((c) => c.id === assignment.course_id)?.title ?? `Kurs #${assignment.course_id}`,
        deadline: assignment.deadline
          ? new Date(assignment.deadline).toLocaleString()
          : 'No deadline',
      })),
      success,
      error,
    };
  }

  @Post('teacher/courses')
  @Roles(UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('image', { storage: courseImageStorage }))
  async createTeacherCourse(
    @Body('title') title: string,
    @Body('description') description: string,
    @CurrentUser() user: User,
    @UploadedFile(CourseImageValidationPipe)
    image: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    try {
      await this.coursesService.create({ title, description }, user.id, image);
      return res.redirect(
        this.withMessage('/teacher/courses', 'success', 'Course created'),
      );
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Course create failed');
      return res.redirect(
        this.withMessage('/teacher/courses', 'error', message),
      );
    }
  }

  @Post('teacher/courses/:id/update')
  @Roles(UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('image', { storage: courseImageStorage }))
  async updateTeacherCourse(
    @Param('id', ParseIdPipe) id: number,
    @Body('title') title: string,
    @Body('description') description: string,
    @CurrentUser() user: User,
    @UploadedFile(CourseImageValidationPipe)
    image: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    try {
      await this.coursesService.update(
        id,
        { title, description },
        user.id,
        image,
      );
      return res.redirect(
        this.withMessage('/teacher/courses', 'success', 'Course updated'),
      );
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Course update failed');
      return res.redirect(
        this.withMessage('/teacher/courses', 'error', message),
      );
    }
  }

  @Post('teacher/courses/:id/delete')
  @Roles(UserRole.TEACHER)
  async deleteTeacherCourse(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      const course = await this.coursesService.findOne(id);
      if (course.teacher_id !== user.id) {
        throw new HttpException('Forbidden', 403);
      }
      await this.coursesService.remove(id);
      return res.redirect(
        this.withMessage('/teacher/courses', 'success', 'Course deleted'),
      );
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Course delete failed');
      return res.redirect(
        this.withMessage('/teacher/courses', 'error', message),
      );
    }
  }

  @Post('teacher/assignments')
  @Roles(UserRole.TEACHER)
  async createTeacherAssignment(
    @Body('course_id') courseIdRaw: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('deadline') deadline: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      await this.assignmentsService.create(
        { title, description, deadline, course_id: Number(courseIdRaw) },
        user.id,
      );
      return res.redirect(
        this.withMessage('/teacher/courses', 'success', 'Assignment created'),
      );
    } catch (error: unknown) {
      const message = this.extractHttpMessage(
        error,
        'Assignment create failed',
      );
      return res.redirect(
        this.withMessage('/teacher/courses', 'error', message),
      );
    }
  }

  @Post('teacher/assignments/:id/delete')
  @Roles(UserRole.TEACHER)
  async deleteTeacherAssignment(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      await this.assignmentsService.remove(id, user.id);
      return res.redirect(
        this.withMessage('/teacher/courses', 'success', 'Assignment deleted'),
      );
    } catch (error: unknown) {
      const message = this.extractHttpMessage(
        error,
        'Assignment delete failed',
      );
      return res.redirect(
        this.withMessage('/teacher/courses', 'error', message),
      );
    }
  }

  @Get('teacher/submissions')
  @Roles(UserRole.TEACHER)
  @Render('teacher/submissions')
  async teacherSubmissions(
    @CurrentUser() user: User,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ) {
    const allCourses = await this.coursesService.findAll();
    const myCourses = allCourses.filter(
      (course) => course.teacher_id === user.id,
    );
    const assignmentsByCourse = await Promise.all(
      myCourses.map((course) =>
        this.assignmentsService.findByCourse(course.id),
      ),
    );
    const assignments = assignmentsByCourse.flat();
    const submissionsByAssignment = await Promise.all(
      assignments.map((assignment) =>
        this.submissionsService.findByAssignment(assignment.id),
      ),
    );
    const submissions = submissionsByAssignment.flat();

    return {
      title: 'Teacher Submissions',
      page: 'teacher-submissions',
      submissions: submissions.map((submission) => ({
        id: submission.id,
        assignment: submission.assignment?.title ?? '-',
        student: submission.student?.full_name ?? '-',
        file: submission.file,
        score: submission.score,
        scoreClass: submission.score === null || submission.score === undefined
          ? 'score-none'
          : submission.score >= 80
            ? 'score-high'
            : submission.score >= 50
              ? 'score-mid'
              : 'score-low',
        hasScore: submission.score !== null && submission.score !== undefined,
      })),
      success,
      error,
    };
  }

  @Post('teacher/submissions/:id/score')
  @Roles(UserRole.TEACHER)
  async scoreSubmission(
    @Param('id', ParseIdPipe) id: number,
    @Body('score') scoreRaw: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      const score = parseInt(scoreRaw, 10);
      if (isNaN(score) || score < 0 || score > 100) {
        return res.redirect(
          this.withMessage('/teacher/submissions', 'error', 'Ball 0 dan 100 gacha bo\'lishi kerak'),
        );
      }
      await this.submissionsService.score(id, { score }, user.id);
      return res.redirect(
        this.withMessage('/teacher/submissions', 'success', 'Ball saqlandi'),
      );
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Score update failed');
      return res.redirect(
        this.withMessage('/teacher/submissions', 'error', message),
      );
    }
  }

  // ─── Admin ───────────────────────────────────────────────────────────────────

  @Get('admin/users')
  @Roles(UserRole.ADMIN)
  @Render('admin/users')
  async adminUsers(
    @CurrentUser() user: User,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ) {
    const users = await this.usersService.findAll(1, 50);

    return {
      title: 'Admin Users',
      page: 'admin-users',
      userName: user.full_name,
      stats: {
        totalUsers: users.count,
        activeUsers: users.rows.filter((item) => item.is_active).length,
      },
      users: users.rows,
      success,
      error,
    };
  }

  @Post('admin/users/:id/toggle-active')
  @Roles(UserRole.ADMIN)
  async adminToggleUserActive(
    @Param('id', ParseIdPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const user = await this.usersService.findOne(id);
      await this.usersService.update(id, { is_active: !user.is_active });
      const msg = user.is_active ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi faollashtirildi';
      return res.redirect(`/admin/users?success=${encodeURIComponent(msg)}`);
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Update failed');
      return res.redirect(`/admin/users?error=${encodeURIComponent(message)}`);
    }
  }

  @Post('admin/users/:id/change-role')
  @Roles(UserRole.ADMIN)
  async adminChangeUserRole(
    @Param('id', ParseIdPipe) id: number,
    @Body('role') role: string,
    @Res() res: Response,
  ) {
    try {
      const validRoles = Object.values(UserRole) as string[];
      if (!validRoles.includes(role)) {
        return res.redirect(`/admin/users?error=${encodeURIComponent('Noto\'g\'ri rol')}`);
      }
      await this.usersService.update(id, { role: role as UserRole });
      return res.redirect(`/admin/users?success=${encodeURIComponent('Rol o\'zgartirildi')}`);
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Role update failed');
      return res.redirect(`/admin/users?error=${encodeURIComponent(message)}`);
    }
  }

  @Post('admin/users/:id/delete')
  @Roles(UserRole.ADMIN)
  async adminDeleteUser(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      if (id === user.id) {
        return res.redirect(`/admin/users?error=${encodeURIComponent('O\'zingizni o\'chira olmaysiz')}`);
      }
      await this.usersService.remove(id);
      return res.redirect(`/admin/users?success=${encodeURIComponent('Foydalanuvchi o\'chirildi')}`);
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Delete failed');
      return res.redirect(`/admin/users?error=${encodeURIComponent(message)}`);
    }
  }

  @Get('admin/courses')
  @Roles(UserRole.ADMIN)
  @Render('admin/courses')
  async adminCourses(
    @CurrentUser() user: User,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ) {
    const courses = await this.coursesService.findAll();

    return {
      title: 'Admin Courses',
      page: 'admin-courses',
      userName: user.full_name,
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        teacher: course.teacher?.full_name ?? 'Unknown',
        category: course.category?.name,
      })),
      success,
      error,
    };
  }

  @Post('admin/courses/:id/delete')
  @Roles(UserRole.ADMIN)
  async adminDeleteCourse(
    @Param('id', ParseIdPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      await this.coursesService.remove(id);
      return res.redirect('/admin/courses?success=Course%20deleted');
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Course delete failed');
      return res.redirect(
        `/admin/courses?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Get('admin/categories')
  @Roles(UserRole.ADMIN)
  @Render('admin/categories')
  async adminCategories(
    @CurrentUser() user: User,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ) {
    const categories = await this.categoriesService.findAll();

    return {
      title: 'Admin Categories',
      page: 'admin-categories',
      userName: user.full_name,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        created_at: c.created_at
          ? new Date(c.created_at).toLocaleDateString('uz-UZ')
          : '—',
        courseCount: Array.isArray((c as any).courses)
          ? (c as any).courses.length
          : 0,
      })),
      success,
      error,
    };
  }

  @Post('admin/categories')
  @Roles(UserRole.ADMIN)
  async adminCreateCategory(
    @Body() dto: CreateCategoryDto,
    @Res() res: Response,
  ) {
    try {
      await this.categoriesService.create(dto);
      return res.redirect('/admin/categories?success=Category%20created');
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Category create failed');
      return res.redirect(
        `/admin/categories?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('admin/categories/:id/delete')
  @Roles(UserRole.ADMIN)
  async adminDeleteCategory(
    @Param('id', ParseIdPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      await this.categoriesService.remove(id);
      return res.redirect('/admin/categories?success=Category%20deleted');
    } catch (error: unknown) {
      const message = this.extractHttpMessage(error, 'Category delete failed');
      return res.redirect(
        `/admin/categories?error=${encodeURIComponent(message)}`,
      );
    }
  }
}

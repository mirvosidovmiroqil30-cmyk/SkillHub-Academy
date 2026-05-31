import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
  CreatedAt,
  HasMany,
} from 'sequelize-typescript';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Course } from '../../courses/models/course.model';
import { Enrollment } from '../../enrollments/models/enrollment.model';
import { Submission } from '../../submissions/models/submission.model';

@Table({ tableName: 'users', timestamps: true, updatedAt: false })
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare full_name: string;

  @Unique
  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
  })
  declare role: UserRole;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare is_active: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  declare telegram_id: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;

  @HasMany(() => Course, { foreignKey: 'teacher_id' })
  declare courses: Course[];

  @HasMany(() => Enrollment, { foreignKey: 'student_id' })
  declare enrollments: Enrollment[];

  @HasMany(() => Submission, { foreignKey: 'student_id' })
  declare submissions: Submission[];
}

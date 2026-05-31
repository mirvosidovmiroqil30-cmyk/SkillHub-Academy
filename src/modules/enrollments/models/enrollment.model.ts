import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Course } from '../../courses/models/course.model';

@Table({
  tableName: 'enrollments',
  timestamps: false,
  indexes: [{ unique: true, fields: ['student_id', 'course_id'] }],
})
export class Enrollment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare student_id: number;

  @BelongsTo(() => User, { foreignKey: 'student_id', as: 'student' })
  declare student: User;

  @ForeignKey(() => Course)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare course_id: number;

  @BelongsTo(() => Course)
  declare course: Course;
}

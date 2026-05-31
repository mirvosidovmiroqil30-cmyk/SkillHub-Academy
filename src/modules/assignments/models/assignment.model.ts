import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
} from 'sequelize-typescript';
import { Course } from '../../courses/models/course.model';
import { Submission } from '../../submissions/models/submission.model';

@Table({ tableName: 'assignments', timestamps: true, updatedAt: false })
export class Assignment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare deadline: Date;

  @ForeignKey(() => Course)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare course_id: number;

  @BelongsTo(() => Course, { foreignKey: 'course_id', as: 'course' })
  declare course: Course;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;

  @HasMany(() => Submission, { onDelete: 'CASCADE' })
  declare submissions: Submission[];
}

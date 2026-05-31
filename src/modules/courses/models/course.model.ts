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
import { User } from '../../users/models/user.model';
import { Category } from '../../categories/models/category.model';
import { Enrollment } from '../../enrollments/models/enrollment.model';
import { Assignment } from '../../assignments/models/assignment.model';

@Table({ tableName: 'courses', timestamps: true, updatedAt: false })
export class Course extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare image: string;

  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare category_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare teacher_id: number;

  @BelongsTo(() => Category)
  declare category: Category;

  @BelongsTo(() => User, { foreignKey: 'teacher_id', as: 'teacher' })
  declare teacher: User;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;

  @HasMany(() => Enrollment, { onDelete: 'CASCADE', foreignKey: 'course_id' })
  declare enrollments: Enrollment[];

  @HasMany(() => Assignment, { onDelete: 'CASCADE', foreignKey: 'course_id' })
  declare assignments: Assignment[];
}

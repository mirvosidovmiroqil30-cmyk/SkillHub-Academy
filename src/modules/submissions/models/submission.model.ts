import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { Assignment } from '../../assignments/models/assignment.model';
import { User } from '../../users/models/user.model';

@Table({
  tableName: 'submissions',
  timestamps: true,
  updatedAt: false,
  indexes: [{ unique: true, fields: ['assignment_id', 'student_id'] }],
})
export class Submission extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Assignment)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare assignment_id: number;

  @BelongsTo(() => Assignment, { foreignKey: 'assignment_id', as: 'assignment' })
  declare assignment: Assignment;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare student_id: number;

  @BelongsTo(() => User, { foreignKey: 'student_id', as: 'student' })
  declare student: User;

  @Column({ type: DataType.STRING, allowNull: false })
  declare file: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare score: number;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;
}

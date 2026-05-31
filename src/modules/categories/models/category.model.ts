import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  HasMany,
} from 'sequelize-typescript';
import { Course } from '../../courses/models/course.model';

@Table({ tableName: 'categories', timestamps: true, updatedAt: false })
export class Category extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;

  @HasMany(() => Course)
  declare courses: Course[];
}

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = parseInt(value, 10);

    if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
      throw new BadRequestException(
        `Invalid ID: "${value}". ID must be a positive integer.`,
      );
    }

    return id;
  }
}

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      return file;
    }

    if (!this.options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: "${file.mimetype}". Allowed types: ${this.options.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > this.options.maxSizeBytes) {
      const maxMB = this.options.maxSizeBytes / (1024 * 1024);
      throw new BadRequestException(
        `File too large. Maximum allowed size is ${maxMB}MB.`,
      );
    }

    return file;
  }
}

// Pre-configured instances
export const CourseImageValidationPipe = new FileValidationPipe({
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
});

export const SubmissionFileValidationPipe = new FileValidationPipe({
  allowedMimeTypes: [
    'application/pdf',
    'application/zip',
    'image/jpeg',
    'image/png',
  ],
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
});

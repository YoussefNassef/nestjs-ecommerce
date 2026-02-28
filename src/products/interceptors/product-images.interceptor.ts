/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadedImageFile } from '../types/uploaded-image-file.type';

const imageFileFilter = (
  _: unknown,
  file: UploadedImageFile,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new BadRequestException('Only image files are allowed'), false);
    return;
  }
  cb(null, true);
};

export const ProductImagesInterceptor = FileFieldsInterceptor(
  [
    { name: 'mainPicture', maxCount: 1 },
    { name: 'subPictures', maxCount: 3 },
  ],
  {
    storage: memoryStorage(),
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  },
);

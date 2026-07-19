import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UploadedImage {
  key: string;
  url: string;
}

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('STORAGE_BUCKET') ?? '';
    this.endpoint = (this.configService.get<string>('STORAGE_ENDPOINT') ?? '').replace(/\/$/, '');

    this.client = new S3Client({
      endpoint: this.endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.get<string>('STORAGE_ACCESS_KEY') ?? '',
        secretAccessKey: this.configService.get<string>('STORAGE_SECRET_KEY') ?? '',
      },
    });
  }

  async uploadProductImage(file: Express.Multer.File): Promise<UploadedImage> {
    const extension = this.resolveExtension(file);
    const key = `products/${uuidv4()}${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      key,
      url: `${this.endpoint}/${this.bucket}/${key}`,
    };
  }

  async deleteByUrl(url: string): Promise<void> {
    const key = this.extractKeyFromUrl(url);
    if (!key) {
      return;
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private resolveExtension(file: Express.Multer.File): string {
    const extByMime: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    return extByMime[file.mimetype] ?? extname(file.originalname).toLowerCase();
  }

  private extractKeyFromUrl(url: string): string | null {
    const bucketPrefix = `/${this.bucket}/`;
    const parsed = new URL(url);
    const index = parsed.pathname.indexOf(bucketPrefix);
    if (index === -1) {
      return null;
    }
    return parsed.pathname.slice(index + bucketPrefix.length);
  }
}

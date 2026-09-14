import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Client } from 'minio';
import { FileStorage } from './file-storage';

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class MinioFileStorage extends FileStorage implements OnModuleInit {
  private readonly logger = new Logger(MinioFileStorage.name);
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
    this.publicUrl = this.config.getOrThrow<string>('MINIO_PUBLIC_URL');
    this.client = new Client({
      endPoint: this.config.getOrThrow<string>('MINIO_ENDPOINT'),
      port: this.config.get<number>('MINIO_PORT') ?? 9000,
      useSSL: this.config.get<boolean>('MINIO_USE_SSL') ?? false,
      accessKey: this.config.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.config.getOrThrow<string>('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureReady();
  }

  async ensureReady(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Created MinIO bucket ${this.bucket}`);
    }
  }

  async upload(params: {
    buffer: Buffer;
    mimeType: string;
    keyPrefix: string;
  }): Promise<{ key: string }> {
    const extension = MIME_EXTENSION[params.mimeType] ?? '';
    const key = `${params.keyPrefix}/${randomUUID()}${extension}`;
    await this.client.putObject(
      this.bucket,
      key,
      params.buffer,
      params.buffer.length,
      { 'Content-Type': params.mimeType },
    );
    return { key };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key);
    } catch {
      this.logger.warn(`Failed to delete object ${key}`);
    }
  }

  async getUrl(key: string): Promise<string> {
    const signed = await this.client.presignedGetObject(this.bucket, key, 3600);
    const signedUrl = new URL(signed);
    const publicBase = new URL(this.publicUrl);
    signedUrl.protocol = publicBase.protocol;
    signedUrl.host = publicBase.host;
    if (publicBase.pathname && publicBase.pathname !== '/') {
      signedUrl.pathname = `${publicBase.pathname.replace(/\/$/, '')}${signedUrl.pathname}`;
    }
    return signedUrl.toString();
  }
}

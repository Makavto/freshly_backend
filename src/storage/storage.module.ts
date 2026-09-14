import { Module } from '@nestjs/common';
import { FileStorage } from './file-storage';
import { MinioFileStorage } from './minio.storage';

@Module({
  providers: [{ provide: FileStorage, useClass: MinioFileStorage }],
  exports: [FileStorage],
})
export class StorageModule {}

export abstract class FileStorage {
  abstract upload(params: {
    buffer: Buffer;
    mimeType: string;
    keyPrefix: string;
  }): Promise<{ key: string }>;

  abstract delete(key: string): Promise<void>;

  abstract getUrl(key: string): Promise<string>;

  abstract ensureReady(): Promise<void>;
}

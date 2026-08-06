import { UploadService } from '../services/upload.service';
import { FileCategory } from '../config/upload';

const mockUploadStream = { end: jest.fn() };
const mockUploadStreamFn = jest.fn();

jest.mock('../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: (...args: unknown[]) => {
        mockUploadStreamFn(...args);
        return mockUploadStream;
      },
      destroy: jest.fn().mockResolvedValue({}),
    },
  },
}));

const uploadService = new UploadService();

const SUCCESS_RESULT = {
  secure_url: 'https://res.cloudinary.com/test/image/upload/v1/abc.jpg',
  public_id: 'abc',
  resource_type: 'image',
  format: 'jpg',
};

function createMockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'photo',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.alloc(1024 * 1024),
    size: 1024 * 1024,
    destination: '',
    filename: 'photo.jpg',
    path: '',
    stream: null as any,
    ...overrides,
  };
}

function lastUploadOptions(): Record<string, any> {
  const calls = mockUploadStreamFn.mock.calls;
  return calls[calls.length - 1][0] as Record<string, any>;
}

function resolveUpload(result: Record<string, any> = SUCCESS_RESULT): void {
  const calls = mockUploadStreamFn.mock.calls;
  const callback = calls[calls.length - 1][1] as (err?: unknown, result?: unknown) => void;
  callback(undefined, result);
}

function rejectUpload(error: Record<string, unknown>): void {
  const calls = mockUploadStreamFn.mock.calls;
  const callback = calls[calls.length - 1][1] as (err?: unknown, result?: unknown) => void;
  callback(error);
}

describe('UploadService upload timeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scales the Cloudinary timeout up for large files', async () => {
    const file = createMockFile({ size: 50 * 1024 * 1024, originalname: 'resume.pdf', mimetype: 'application/pdf' });
    const promise = uploadService.uploadFile(file, FileCategory.DOCUMENT);

    const options = lastUploadOptions();
    expect(options.timeout).toBeGreaterThan(60_000);
    expect(options.timeout).toBeLessThanOrEqual(15 * 60_000);

    resolveUpload();
    await promise;
  });

  it('never drops below the SDK default timeout for small files', async () => {
    const file = createMockFile({ size: 1024 });
    const promise = uploadService.uploadFile(file, FileCategory.IMAGE);

    const options = lastUploadOptions();
    expect(options.timeout).toBeGreaterThanOrEqual(60_000);

    resolveUpload();
    await promise;
  });

  it('passes the configured folder and resource type to Cloudinary', async () => {
    const file = createMockFile();
    const promise = uploadService.uploadFile(file, FileCategory.IMAGE);

    const options = lastUploadOptions();
    expect(options.folder).toBe('nextera/images');
    expect(options.resource_type).toBe('image');

    resolveUpload();
    await promise;
  });
});

describe('UploadService error translation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps Cloudinary file-size rejections to a 400 with the actual limit', async () => {
    const file = createMockFile();
    const promise = uploadService.uploadFile(file, FileCategory.IMAGE);

    rejectUpload({ message: 'File size too large. Got 10926001. Maximum is 10485760.', http_code: 400, name: 'Error' });

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: 'File is too large. The upload service supports files up to 10MB.',
    });
  });

  it('maps Cloudinary timeout errors to a clear internal error', async () => {
    const file = createMockFile();
    const promise = uploadService.uploadFile(file, FileCategory.IMAGE);

    rejectUpload({ message: 'Request Timeout', http_code: 499, name: 'TimeoutError' });

    await expect(promise).rejects.toMatchObject({
      statusCode: 500,
      message: expect.stringContaining('timed out'),
    });
  });

  it('maps unsupported file-type errors to a 400', async () => {
    const file = createMockFile();
    const promise = uploadService.uploadFile(file, FileCategory.IMAGE);

    rejectUpload({ message: 'Unsupported file type jpeg', http_code: 400, name: 'Error' });

    await expect(promise).rejects.toMatchObject({
      statusCode: 400,
      message: 'File format is not supported by the upload service.',
    });
  });

  it('keeps a generic 500 for unknown Cloudinary failures', async () => {
    const file = createMockFile();
    const promise = uploadService.uploadFile(file, FileCategory.IMAGE);

    rejectUpload({ message: 'boom', http_code: 500, name: 'Error' });

    await expect(promise).rejects.toMatchObject({
      statusCode: 500,
      message: 'File upload failed',
    });
  });
});

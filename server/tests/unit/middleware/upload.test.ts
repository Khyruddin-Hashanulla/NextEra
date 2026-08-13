import {
  createUploadMiddleware,
  createMultiUploadMiddleware,
  createFieldUploadMiddleware,
  handleMulterError,
  FileCategory,
} from '../../../src/middlewares/upload.middleware';
import * as uploadUtils from '../../../src/utils/upload';

const hoisted = vi.hoisted(() => {
  const state: { capturedOptions: any; capturedFields: any } = {
    capturedOptions: {},
    capturedFields: null,
  };

  class MockMulterError extends Error {
    code: string;
    field?: string;
    constructor(code: string, field?: string) {
      super(code);
      this.code = code;
      this.field = field;
    }
  }

  const multerFn = vi.fn((opts: any) => {
    state.capturedOptions = opts;
    const result: any = {};
    result.single = vi.fn();
    result.array = vi.fn();
    result.fields = vi.fn((f: any) => {
      state.capturedFields = f;
      return vi.fn();
    });
    return result;
  });
  multerFn.memoryStorage = vi.fn(() => ({}));
  multerFn.MulterError = MockMulterError;

  return { state, multerFn, MockMulterError };
});

vi.mock('multer', () => ({
  __esModule: true,
  default: hoisted.multerFn,
}));

function file(mimetype: string, originalname: string, fieldname = 'file'): any {
  return { mimetype, originalname, fieldname, buffer: Buffer.from('x') };
}

function runFilter(fileFilter: (req: any, f: any, cb: any) => void, f: any) {
  const cb = vi.fn();
  fileFilter({}, f, cb);
  return cb;
}

describe('upload middleware', () => {
  beforeEach(() => {
    hoisted.state.capturedOptions = {};
    hoisted.state.capturedFields = null;
    vi.clearAllMocks();
  });

  it('createUploadMiddleware accepts a valid image', () => {
    const mw = createUploadMiddleware(FileCategory.IMAGE);
    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('image/png', 'photo.png'));
    expect(cb).toHaveBeenCalledWith(null, true);
    expect(hoisted.state.capturedOptions.limits.fileSize).toBe(5 * 1024 * 1024);
    expect(hoisted.state.capturedOptions.limits.files).toBe(1);
    expect(mw).toBeDefined();
  });

  it('createUploadMiddleware rejects a bad mime type', () => {
    createUploadMiddleware(FileCategory.IMAGE);
    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('text/html', 'photo.png'));
    const [err] = cb.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('Invalid file type');
  });

  it('createUploadMiddleware rejects a bad extension', () => {
    createUploadMiddleware(FileCategory.IMAGE);
    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('image/png', 'photo.exe'));
    const [err] = cb.mock.calls[0];
    expect(err.message).toContain('Invalid file extension');
  });

  it('createUploadMiddleware rejects an invalid filename', () => {
    createUploadMiddleware(FileCategory.IMAGE);
    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('image/png', '..//../evil.png'));
    const [err] = cb.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
  });

  it('createUploadMiddleware falls back to a generic filename error', () => {
    vi.spyOn(uploadUtils, 'validateFilename').mockReturnValue({ valid: false });
    createUploadMiddleware(FileCategory.IMAGE);
    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('image/png', 'x.png'));
    const [err] = cb.mock.calls[0];
    expect(err.message).toBe('Invalid filename');
  });

  it('createMultiUploadMiddleware allows multiple files', () => {
    createMultiUploadMiddleware(FileCategory.PDF, 3);
    expect(hoisted.state.capturedOptions.limits.files).toBe(3);
  });

  it('createMultiUploadMiddleware defaults to 5 files', () => {
    createMultiUploadMiddleware(FileCategory.PDF);
    expect(hoisted.state.capturedOptions.limits.files).toBe(5);
  });

  it('createFieldUploadMiddleware builds fields config and filters by field', () => {
    const mw = createFieldUploadMiddleware([
      { name: 'avatar', category: FileCategory.PROFILE_PICTURE },
      { name: 'doc', category: FileCategory.PDF, maxCount: 2 },
    ]);
    expect(hoisted.state.capturedFields).toEqual([
      { name: 'avatar', maxCount: 1 },
      { name: 'doc', maxCount: 2 },
    ]);
    expect(hoisted.state.capturedOptions.limits.files).toBe(3);
    expect(mw).toBeDefined();

    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('application/pdf', 'resume.pdf', 'doc'));
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('createFieldUploadMiddleware rejects an unexpected field', () => {
    createFieldUploadMiddleware([{ name: 'avatar', category: FileCategory.PROFILE_PICTURE }]);
    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('image/png', 'x.png', 'other'));
    const [err] = cb.mock.calls[0];
    expect(err.message).toBe('Unexpected field: other');
  });

  it('createFieldUploadMiddleware rejects a bad mime type for a field', () => {
    createFieldUploadMiddleware([{ name: 'avatar', category: FileCategory.PROFILE_PICTURE }]);
    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('application/pdf', 'x.pdf', 'avatar'));
    const [err] = cb.mock.calls[0];
    expect(err.message).toContain('Invalid file type for avatar');
  });

  it('createFieldUploadMiddleware rejects a bad extension for a field', () => {
    createFieldUploadMiddleware([{ name: 'avatar', category: FileCategory.PROFILE_PICTURE }]);
    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('image/png', 'x.exe', 'avatar'));
    const [err] = cb.mock.calls[0];
    expect(err.message).toContain('Invalid file extension for avatar');
  });

  it('createFieldUploadMiddleware rejects an invalid filename for a field', () => {
    createFieldUploadMiddleware([{ name: 'avatar', category: FileCategory.PROFILE_PICTURE }]);
    const cb = runFilter(hoisted.state.capturedOptions.fileFilter, file('image/png', '..//../evil.png', 'avatar'));
    const [err] = cb.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
  });

  it('handleMulterError maps multer error codes', () => {
    expect(handleMulterError(new hoisted.MockMulterError('LIMIT_FILE_SIZE'))).toBe('File is too large');
    expect(handleMulterError(new hoisted.MockMulterError('LIMIT_FILE_COUNT'))).toBe('Too many files');
    expect(handleMulterError(new hoisted.MockMulterError('LIMIT_UNEXPECTED_FILE', 'x'))).toBe(
      'Unexpected file field: x'
    );
    expect(handleMulterError(new hoisted.MockMulterError('LIMIT_PART_COUNT'))).toBe('Too many parts');
    expect(handleMulterError(new hoisted.MockMulterError('LIMIT_FIELD_KEY'))).toBe('Field name too long');
    expect(handleMulterError(new hoisted.MockMulterError('LIMIT_FIELD_VALUE'))).toBe('Field value too long');
    expect(handleMulterError(new hoisted.MockMulterError('LIMIT_FIELD_COUNT'))).toBe('Too many fields');
    expect(handleMulterError(new hoisted.MockMulterError('SOMETHING'))).toBe('Upload error');
  });

  it('handleMulterError returns the message for generic errors', () => {
    expect(handleMulterError(new Error('custom failure'))).toBe('custom failure');
  });

  it('handleMulterError returns a fallback for non-errors', () => {
    expect(handleMulterError('garbage')).toBe('Upload failed');
  });
});

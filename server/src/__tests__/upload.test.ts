import {
  sanitizeFilename,
  generateSafeFilename,
  validateMimeType,
  validateExtension,
  validateFileSize,
  validateFilename,
  validateUploadedFile,
  validateCloudinaryResponse,
  getPolicyForCategory,
  FileCategory,
} from '../utils/upload';
import { handleMulterError } from '../middlewares/upload.middleware';
import { UPLOAD_POLICIES } from '../config/upload';
import multer from 'multer';

function createMockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 1024,
    destination: '',
    filename: 'test.jpg',
    path: '',
    stream: null as any,
    ...overrides,
  };
}

describe('sanitizeFilename', () => {
  it('removes null bytes', () => {
    const result = sanitizeFilename('file\x00.jpg');
    expect(result).not.toContain('\x00');
    expect(result).toBe('file.jpg');
  });

  it('removes path traversal sequences', () => {
    const result = sanitizeFilename('../../etc/passwd');
    expect(result).not.toContain('..');
  });

  it('removes backslash path traversal', () => {
    const result = sanitizeFilename('..\\..\\windows\\system32');
    expect(result).not.toContain('..');
  });

  it('replaces special characters with underscores', () => {
    expect(sanitizeFilename('file<>:"/\\|?*.txt')).toBe('file_________.txt');
  });

  it('replaces whitespace with underscores', () => {
    expect(sanitizeFilename('my file name.jpg')).toBe('my_file_name.jpg');
  });

  it('prefixes hidden files with underscore', () => {
    expect(sanitizeFilename('.bashrc')).toBe('_.bashrc');
  });

  it('truncates to 255 characters', () => {
    const long = 'a'.repeat(300) + '.txt';
    const result = sanitizeFilename(long);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('returns untitled for empty filename', () => {
    expect(sanitizeFilename('')).toBe('untitled');
  });

  it('handles whitespace-only filename', () => {
    const result = sanitizeFilename('   ');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toMatch(/\s/);
  });
});

describe('generateSafeFilename', () => {
  it('preserves original extension', () => {
    const result = generateSafeFilename('photo.jpg');
    expect(result).toMatch(/\.jpg$/);
  });

  it('generates unique suffix', () => {
    const a = generateSafeFilename('photo.jpg');
    const b = generateSafeFilename('photo.jpg');
    expect(a).not.toBe(b);
  });

  it('replaces unsafe characters in base name', () => {
    const result = generateSafeFilename('<script>.jpg');
    expect(result).toMatch(/^_script__[a-f0-9]{16}\.jpg$/);
  });

  it('handles filename without extension', () => {
    const result = generateSafeFilename('noext');
    expect(result).toMatch(/^noext_\w{16}$/);
  });
});

describe('validateMimeType', () => {
  const imagePolicy = UPLOAD_POLICIES[FileCategory.IMAGE];

  it('accepts valid MIME types', () => {
    expect(validateMimeType('image/jpeg', imagePolicy)).toBe(true);
    expect(validateMimeType('image/png', imagePolicy)).toBe(true);
    expect(validateMimeType('image/webp', imagePolicy)).toBe(true);
  });

  it('rejects invalid MIME types', () => {
    expect(validateMimeType('application/pdf', imagePolicy)).toBe(false);
    expect(validateMimeType('text/html', imagePolicy)).toBe(false);
    expect(validateMimeType('image/svg+xml', imagePolicy)).toBe(false);
  });
});

describe('validateExtension', () => {
  const imagePolicy = UPLOAD_POLICIES[FileCategory.IMAGE];

  it('accepts valid extensions', () => {
    expect(validateExtension('photo.jpg', imagePolicy)).toBe(true);
    expect(validateExtension('photo.jpeg', imagePolicy)).toBe(true);
    expect(validateExtension('photo.PNG', imagePolicy)).toBe(true);
  });

  it('rejects invalid extensions', () => {
    expect(validateExtension('photo.pdf', imagePolicy)).toBe(false);
    expect(validateExtension('photo.exe', imagePolicy)).toBe(false);
    expect(validateExtension('photo.html', imagePolicy)).toBe(false);
  });
});

describe('validateFileSize', () => {
  const imagePolicy = UPLOAD_POLICIES[FileCategory.IMAGE];

  it('accepts files within size limit', () => {
    expect(validateFileSize(1024, imagePolicy)).toBe(true);
    expect(validateFileSize(imagePolicy.maxSize, imagePolicy)).toBe(true);
  });

  it('rejects empty files', () => {
    expect(validateFileSize(0, imagePolicy)).toBe(false);
  });

  it('rejects oversized files', () => {
    expect(validateFileSize(imagePolicy.maxSize + 1, imagePolicy)).toBe(false);
  });
});

describe('validateFilename', () => {
  it('rejects null filename', () => {
    const result = validateFilename(null as any);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('rejects non-string filename', () => {
    const result = validateFilename(123 as any);
    expect(result.valid).toBe(false);
  });

  it('rejects empty filename', () => {
    expect(validateFilename('').valid).toBe(false);
  });

  it('rejects very long filenames', () => {
    expect(validateFilename('a'.repeat(600) + '.txt').valid).toBe(false);
  });

  it('rejects executable extensions', () => {
    expect(validateFilename('virus.exe').valid).toBe(false);
    expect(validateFilename('installer.msi').valid).toBe(false);
    expect(validateFilename('script.bat').valid).toBe(false);
    expect(validateFilename('shell.sh').valid).toBe(false);
  });

  it('rejects double extensions with dangerous trailing type', () => {
    expect(validateFilename('photo.jpg.exe').valid).toBe(false);
    expect(validateFilename('resume.pdf.bat').valid).toBe(false);
  });

  it('rejects php files', () => {
    expect(validateFilename('shell.php').valid).toBe(false);
    expect(validateFilename('index.phtml').valid).toBe(false);
  });

  it('rejects .htaccess', () => {
    expect(validateFilename('.htaccess').valid).toBe(false);
  });

  it('rejects .hta files', () => {
    expect(validateFilename('evil.hta').valid).toBe(false);
  });

  it('rejects hidden files', () => {
    expect(validateFilename('.hidden').valid).toBe(false);
  });

  it('rejects files with null bytes', () => {
    const result = validateFilename('file\x00.jpg');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('null byte');
  });

  it('rejects directory traversal filenames', () => {
    expect(validateFilename('..').valid).toBe(false);
    expect(validateFilename('...').valid).toBe(false);
  });

  it('accepts safe filenames', () => {
    const result = validateFilename('resume.pdf');
    expect(result.valid).toBe(true);
    expect(result.sanitizedFilename).toBe('resume.pdf');
  });

  it('returns sanitized filename for filenames needing cleanup', () => {
    const result = validateFilename('my resume 2024.pdf');
    expect(result.valid).toBe(true);
    expect(result.sanitizedFilename).toBe('my_resume_2024.pdf');
  });
});

describe('validateUploadedFile', () => {
  const imagePolicy = UPLOAD_POLICIES[FileCategory.IMAGE];

  it('rejects missing file', () => {
    expect(() => validateUploadedFile(undefined, imagePolicy)).toThrow('No file provided');
  });

  it('rejects empty file', () => {
    const file = createMockFile({ size: 0 });
    expect(() => validateUploadedFile(file, imagePolicy)).toThrow('empty');
  });

  it('rejects oversized file', () => {
    const file = createMockFile({ size: 100 * 1024 * 1024 });
    expect(() => validateUploadedFile(file, imagePolicy)).toThrow('not exceed');
  });

  it('rejects invalid MIME type', () => {
    const file = createMockFile({ mimetype: 'application/pdf', originalname: 'doc.pdf' });
    expect(() => validateUploadedFile(file, imagePolicy)).toThrow('Invalid file type');
  });

  it('rejects invalid extension', () => {
    const file = createMockFile({ originalname: 'photo.pdf', mimetype: 'image/jpeg' });
    expect(() => validateUploadedFile(file, imagePolicy)).toThrow('Invalid file extension');
  });

  it('rejects dangerous filename', () => {
    const file = createMockFile({ originalname: 'photo.jpg.exe' });
    expect(() => validateUploadedFile(file, imagePolicy)).toThrow('Invalid file');
  });

  it('accepts valid file', () => {
    const file = createMockFile();
    expect(() => validateUploadedFile(file, imagePolicy)).not.toThrow();
  });
});

describe('validateCloudinaryResponse', () => {
  it('rejects null response', () => {
    expect(() => validateCloudinaryResponse(null)).toThrow('empty response');
  });

  it('rejects response without URL', () => {
    expect(() => validateCloudinaryResponse({ public_id: 'abc' })).toThrow('invalid URL');
  });

  it('rejects non-HTTPS URL', () => {
    const result = {
      secure_url: 'http://res.cloudinary.com/dp0o3faxz/image.jpg',
      public_id: 'abc',
    };
    expect(() => validateCloudinaryResponse(result)).toThrow('non-HTTPS');
  });

  it('rejects response without public_id', () => {
    expect(() => validateCloudinaryResponse({ secure_url: 'https://res.cloudinary.com/dp0o3faxz/image.jpg' })).toThrow(
      'public ID'
    );
  });

  it('rejects executable response format', () => {
    const result = {
      secure_url: 'https://res.cloudinary.com/dp0o3faxz/file.exe',
      public_id: 'abc',
      format: 'exe',
    };
    expect(() => validateCloudinaryResponse(result)).toThrow('suspicious');
  });

  it('rejects URL from wrong cloud account', () => {
    const result = {
      secure_url: 'https://res.cloudinary.com/wrongcloud/image/upload/v1/test.jpg',
      public_id: 'nextera/test123',
      resource_type: 'image',
      format: 'jpg',
    };
    expect(() => validateCloudinaryResponse(result)).toThrow('does not match expected account');
  });

  it('accepts valid cloudinary response', () => {
    const result = {
      secure_url: 'https://res.cloudinary.com/dp0o3faxz/image/upload/v1/test.jpg',
      public_id: 'nextera/test123',
      resource_type: 'image',
      format: 'jpg',
    };
    const parsed = validateCloudinaryResponse(result);
    expect(parsed.url).toBe(result.secure_url);
    expect(parsed.publicId).toBe(result.public_id);
  });
});

describe('getPolicyForCategory', () => {
  it('returns policy for known categories', () => {
    const policy = getPolicyForCategory(FileCategory.IMAGE);
    expect(policy.allowedMimeTypes).toContain('image/jpeg');
    expect(policy.cloudinaryFolder).toBe('nextera/images');
  });

  it('throws for unknown category', () => {
    expect(() => getPolicyForCategory('unknown' as any)).toThrow('Unknown upload category');
  });
});

describe('handleMulterError', () => {
  it('handles LIMIT_FILE_SIZE', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    expect(handleMulterError(err)).toBe('File is too large');
  });

  it('handles LIMIT_FILE_COUNT', () => {
    const err = new multer.MulterError('LIMIT_FILE_COUNT');
    expect(handleMulterError(err)).toBe('Too many files');
  });

  it('handles LIMIT_UNEXPECTED_FILE', () => {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    err.field = 'avatar';
    expect(handleMulterError(err)).toBe('Unexpected file field: avatar');
  });

  it('handles generic Error', () => {
    expect(handleMulterError(new Error('Custom error'))).toBe('Custom error');
  });

  it('handles unknown error type', () => {
    expect(handleMulterError('something')).toBe('Upload failed');
  });
});

describe('extension handling', () => {
  const videoPolicy = UPLOAD_POLICIES[FileCategory.VIDEO];

  it('rejects uppercase dangerous extension', () => {
    expect(validateExtension('script.EXE', videoPolicy)).toBe(false);
  });

  it('rejects double extension jpg.exe', () => {
    expect(validateExtension('image.jpg.exe', videoPolicy)).toBe(false);
  });

  it('accepts valid video extension', () => {
    expect(validateExtension('video.mp4', videoPolicy)).toBe(true);
    expect(validateExtension('video.webm', videoPolicy)).toBe(true);
  });
});

describe('policy consistency', () => {
  it('every allowed MIME type has a corresponding extension', () => {
    for (const policy of Object.values(UPLOAD_POLICIES)) {
      for (const mime of policy.allowedMimeTypes) {
        const isImage = mime.startsWith('image/');
        const isVideo = mime.startsWith('video/');
        const isAudio = mime.startsWith('audio/');
        const isText = mime.startsWith('text/');
        const isApp = mime.startsWith('application/');
        expect(isImage || isVideo || isAudio || isText || isApp).toBe(true);
      }
    }
  });

  it('each policy has non-empty allowed types', () => {
    for (const [_key, policy] of Object.entries(UPLOAD_POLICIES)) {
      expect(policy.allowedMimeTypes.length).toBeGreaterThan(0);
      expect(policy.allowedExtensions.length).toBeGreaterThan(0);
      expect(policy.maxSize).toBeGreaterThan(0);
      expect(policy.cloudinaryFolder).toBeTruthy();
    }
  });
});

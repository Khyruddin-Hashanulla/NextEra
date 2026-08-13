import { ApiError } from '../../../src/utils/ApiError';
import {
  sanitizeFilename,
  generateSafeFilename,
  validateMimeType,
  validateExtension,
  validateFileSize,
  validateFilename,
  validateCloudinaryResponse,
  validateUploadedFile,
  getPolicyForCategory,
  getPolicyForMimeType,
  FileCategory,
} from '../../../src/utils/upload';

const imagePolicy = getPolicyForCategory(FileCategory.IMAGE);

describe('sanitizeFilename', () => {
  it('replaces control characters and separators', () => {
    expect(sanitizeFilename('my file.png')).toBe('my_file.png');
    expect(sanitizeFilename('a/b\\c?d*e')).toBe('a_b_c_d_e');
  });

  it('strips traversal sequences', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('etc_passwd');
  });

  it('prefixes leading dots', () => {
    expect(sanitizeFilename('.hidden')).toBe('_.hidden');
  });

  it('falls back to untitled for empty input', () => {
    expect(sanitizeFilename('')).toBe('untitled');
  });

  it('collapses whitespace to underscores', () => {
    expect(sanitizeFilename('   ')).toBe('_');
  });

  it('truncates very long names to 255 chars', () => {
    const out = sanitizeFilename('a'.repeat(300));
    expect(out.length).toBe(255);
  });
});

describe('generateSafeFilename', () => {
  it('keeps a safe extension and randomizes the base', () => {
    const out = generateSafeFilename('Report_Final.pdf');
    expect(out).toMatch(/^Report_Final_[a-f0-9]{16}\.pdf$/);
  });

  it('produces unique names for the same input', () => {
    const a = generateSafeFilename('same.txt');
    const b = generateSafeFilename('same.txt');
    expect(a).not.toBe(b);
  });

  it('sanitizes unsafe characters in the base name', () => {
    const out = generateSafeFilename('my file@name!.png');
    expect(out).toMatch(/^my_file_name__[a-f0-9]{16}\.png$/);
  });

  it('handles filenames without an extension', () => {
    const out = generateSafeFilename('noext');
    expect(out).toMatch(/^noext_[a-f0-9]{16}$/);
  });
});

describe('validateMimeType / validateExtension / validateFileSize', () => {
  it('validates allowed mime types', () => {
    expect(validateMimeType('image/png', imagePolicy)).toBe(true);
    expect(validateMimeType('application/x-msdownload', imagePolicy)).toBe(false);
  });

  it('validates allowed extensions', () => {
    expect(validateExtension('photo.JPG', imagePolicy)).toBe(true);
    expect(validateExtension('script.js', imagePolicy)).toBe(false);
  });

  it('validates file size bounds', () => {
    expect(validateFileSize(1, imagePolicy)).toBe(true);
    expect(validateFileSize(5 * 1024 * 1024, imagePolicy)).toBe(true);
    expect(validateFileSize(0, imagePolicy)).toBe(false);
    expect(validateFileSize(5 * 1024 * 1024 + 1, imagePolicy)).toBe(false);
  });
});

describe('validateFilename', () => {
  it('rejects missing filenames', () => {
    expect(validateFilename('').valid).toBe(false);
    expect(validateFilename(undefined as unknown as string).valid).toBe(false);
  });

  it('rejects filenames longer than 512 chars', () => {
    expect(validateFilename('a'.repeat(513)).valid).toBe(false);
  });

  it('rejects executable extensions', () => {
    const res = validateFilename('virus.exe');
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Executable/);
  });

  it('rejects dangerous patterns', () => {
    expect(validateFilename('photo.png.exe').valid).toBe(false);
    expect(validateFilename('shell.php').valid).toBe(false);
    expect(validateFilename('.htaccess').valid).toBe(false);
  });

  it('rejects null bytes', () => {
    expect(validateFilename('bad\u0000name.txt').valid).toBe(false);
  });

  it('rejects hidden files and dot-prefixed names', () => {
    expect(validateFilename('.bashrc').valid).toBe(false);
    expect(validateFilename('..hidden').valid).toBe(false);
  });

  it('accepts a safe filename and returns a sanitized version', () => {
    const res = validateFilename('my notes v2.pdf');
    expect(res.valid).toBe(true);
    expect(res.sanitizedFilename).toBe('my_notes_v2.pdf');
  });
});

describe('validateCloudinaryResponse', () => {
  it('throws on empty response', () => {
    expect(() => validateCloudinaryResponse(null)).toThrow(ApiError);
  });

  it('throws when the URL is missing or not https', () => {
    expect(() => validateCloudinaryResponse({})).toThrow(ApiError);
    expect(() => validateCloudinaryResponse({ secure_url: 'http://insecure' })).toThrow(ApiError);
  });

  it('throws when the public id is missing', () => {
    expect(() => validateCloudinaryResponse({ secure_url: 'https://res.cloudinary.com/x.png' })).toThrow(ApiError);
  });

  it('throws on unexpected resource type', () => {
    expect(() =>
      validateCloudinaryResponse({
        secure_url: 'https://res.cloudinary.com/x.png',
        public_id: 'abc',
        resource_type: 'font',
      })
    ).toThrow(ApiError);
  });

  it('throws on suspicious file formats', () => {
    expect(() =>
      validateCloudinaryResponse({
        secure_url: 'https://res.cloudinary.com/x.png',
        public_id: 'abc',
        format: 'exe',
      })
    ).toThrow(ApiError);
  });

  it('returns url and public id for a valid response', () => {
    const out = validateCloudinaryResponse({
      secure_url: 'https://res.cloudinary.com/nextera/images/a.png',
      public_id: 'abc',
      resource_type: 'image',
      format: 'png',
    });
    expect(out).toEqual({ url: 'https://res.cloudinary.com/nextera/images/a.png', publicId: 'abc' });
  });
});

describe('validateUploadedFile', () => {
  const baseFile = {
    size: 100,
    mimetype: 'image/png',
    originalname: 'avatar.png',
  } as Express.Multer.File;

  it('rejects a missing file', () => {
    expect(() => validateUploadedFile(undefined, imagePolicy)).toThrow(ApiError);
  });

  it('rejects empty files', () => {
    expect(() => validateUploadedFile({ ...baseFile, size: 0 }, imagePolicy)).toThrow(ApiError);
  });

  it('rejects oversized files', () => {
    expect(() => validateUploadedFile({ ...baseFile, size: 5 * 1024 * 1024 + 1 }, imagePolicy)).toThrow(ApiError);
  });

  it('rejects disallowed mime types', () => {
    expect(() => validateUploadedFile({ ...baseFile, mimetype: 'text/html' }, imagePolicy)).toThrow(ApiError);
  });

  it('rejects disallowed extensions', () => {
    expect(() => validateUploadedFile({ ...baseFile, originalname: 'avatar.js' }, imagePolicy)).toThrow(ApiError);
  });

  it('rejects unsafe filenames', () => {
    expect(() => validateUploadedFile({ ...baseFile, originalname: 'evil.php' }, imagePolicy)).toThrow(ApiError);
  });

  it('accepts a valid file', () => {
    expect(() => validateUploadedFile(baseFile, imagePolicy)).not.toThrow();
  });
});

describe('getPolicyForCategory / getPolicyForMimeType', () => {
  it('throws for unknown categories', () => {
    expect(() => getPolicyForCategory('nope' as FileCategory)).toThrow(ApiError);
  });

  it('returns a policy for a known category', () => {
    expect(getPolicyForCategory(FileCategory.VIDEO).maxSize).toBe(200 * 1024 * 1024);
  });

  it('finds a policy by mime type', () => {
    const policy = getPolicyForMimeType('video/mp4');
    expect(policy).not.toBeNull();
    expect(policy?.cloudinaryResourceType).toBe('video');
  });

  it('returns null for unknown mime types', () => {
    expect(getPolicyForMimeType('application/octet-stream')).toBeNull();
  });
});

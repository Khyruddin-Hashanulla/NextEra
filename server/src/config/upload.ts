export enum FileCategory {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  PDF = 'pdf',
  ARCHIVE = 'archive',
  SOURCE_CODE = 'source_code',
  CERTIFICATE = 'certificate',
  PROFILE_PICTURE = 'profile_picture',
  ASSIGNMENT_FILE = 'assignment_file',
}

export interface UploadPolicy {
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  maxSize: number;
  cloudinaryResourceType: 'image' | 'video' | 'raw';
  cloudinaryFolder: string;
}

export const UPLOAD_POLICIES: Record<FileCategory, UploadPolicy> = {
  [FileCategory.IMAGE]: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'] as const,
    allowedExtensions: ['.jpg', '.jpeg', '.jfif', '.png', '.webp', '.gif', '.heic', '.heif', '.avif'] as const,
    maxSize: 5 * 1024 * 1024,
    cloudinaryResourceType: 'image',
    cloudinaryFolder: 'nextera/images',
  },
  [FileCategory.VIDEO]: {
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'] as const,
    allowedExtensions: ['.mp4', '.webm', '.mov', '.mkv'] as const,
    maxSize: 200 * 1024 * 1024,
    cloudinaryResourceType: 'video',
    cloudinaryFolder: 'nextera/videos',
  },
  [FileCategory.DOCUMENT]: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/rtf',
    ] as const,
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf'] as const,
    maxSize: 50 * 1024 * 1024,
    cloudinaryResourceType: 'raw',
    cloudinaryFolder: 'nextera/resources',
  },
  [FileCategory.PDF]: {
    allowedMimeTypes: ['application/pdf'] as const,
    allowedExtensions: ['.pdf'] as const,
    maxSize: 50 * 1024 * 1024,
    cloudinaryResourceType: 'raw',
    cloudinaryFolder: 'nextera/documents',
  },
  [FileCategory.ARCHIVE]: {
    allowedMimeTypes: ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/gzip', 'application/x-7z-compressed'] as const,
    allowedExtensions: ['.zip', '.rar', '.gz', '.7z', '.tar'] as const,
    maxSize: 100 * 1024 * 1024,
    cloudinaryResourceType: 'raw',
    cloudinaryFolder: 'nextera/archives',
  },
  [FileCategory.SOURCE_CODE]: {
    allowedMimeTypes: [
      'text/plain', 'text/x-python', 'text/x-java', 'text/javascript',
      'text/x-c', 'text/x-c++', 'text/x-typescript', 'text/html',
      'application/json', 'text/x-yaml', 'text/x-markdown',
    ] as const,
    allowedExtensions: ['.py', '.java', '.js', '.ts', '.c', '.cpp', '.h', '.html', '.css', '.json', '.yaml', '.yml', '.md', '.sh', '.go', '.rs', '.rb', '.php'] as const,
    maxSize: 5 * 1024 * 1024,
    cloudinaryResourceType: 'raw',
    cloudinaryFolder: 'nextera/source-code',
  },
  [FileCategory.CERTIFICATE]: {
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/heic', 'image/heif', 'image/avif'] as const,
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.heic', '.heif', '.avif'] as const,
    maxSize: 10 * 1024 * 1024,
    cloudinaryResourceType: 'raw',
    cloudinaryFolder: 'nextera/certificates',
  },
  [FileCategory.PROFILE_PICTURE]: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'] as const,
    maxSize: 2 * 1024 * 1024,
    cloudinaryResourceType: 'image',
    cloudinaryFolder: 'nextera/avatars',
  },
  [FileCategory.ASSIGNMENT_FILE]: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain',
      'text/x-python',
      'text/javascript',
      'text/x-java',
      'text/x-c',
      'text/x-c++',
      'text/x-typescript',
      'text/html',
      'text/x-markdown',
      'application/json',
    ] as const,
    allowedExtensions: [
      '.pdf', '.doc', '.docx', '.zip', '.rar',
      '.png', '.jpg', '.jpeg', '.webp',
      '.txt', '.py', '.js', '.ts', '.java', '.c', '.cpp', '.h',
      '.html', '.css', '.json', '.md',
    ] as const,
    maxSize: 25 * 1024 * 1024,
    cloudinaryResourceType: 'raw',
    cloudinaryFolder: 'nextera/assignments',
  },
};

export const EXECUTABLE_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.dll', '.so', '.dylib', '.sys', '.drv',
  '.sh', '.bash', '.zsh', '.ksh',
  '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh',
  '.ps1', '.psm1', '.psd1', '.ps1xml',
  '.jar', '.class', '.swf', '.app', '.gadget',
  '.cgi', '.pl', '.py', '.rb', '.php',
]);

export const DANGEROUS_PATTERNS = [
  /\.(exe|bat|cmd|com|msi|scr|pif|dll|so|dylib|vbs|vbe|ps1|jar)\./i,
  /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|mp4|zip)\.(exe|bat|cmd|js|vbs)$/i,
  /\.(php|phtml|php3|php4|php5|php7|pht|phar|shtml|asp|aspx|cgi|pl|py)/i,
  /\.htaccess/i,
  /\.hta$/i,
];

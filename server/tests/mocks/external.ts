export const mockBcrypt = {
  genSalt: vi.fn().mockResolvedValue('salt-test'),
  hash: vi.fn().mockResolvedValue('hashed-password'),
  compare: vi.fn().mockResolvedValue(true),
  hashSync: vi.fn().mockReturnValue('hashed-password'),
  compareSync: vi.fn().mockReturnValue(true),
  genSaltSync: vi.fn().mockReturnValue('salt-test'),
};

export const mockQRCode = {
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,AAAA'),
};

export const mockNodemailerTransporter = {
  sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  verify: vi.fn().mockResolvedValue(true),
};

import { optionalAuthenticate } from '../middlewares/auth.middleware';
import { verifyAccessToken } from '../utils/generateToken';
import { User } from '../models/user.model';

jest.mock('../utils/generateToken', () => ({
  verifyAccessToken: jest.fn(),
}));

jest.mock('../models/user.model', () => ({
  User: { findById: jest.fn() },
}));

const mockVerify = verifyAccessToken as jest.Mock;
const mockUserFindById = User.findById as jest.Mock;

function makeReq(header?: string) {
  return { headers: header ? { authorization: header } : {} } as any;
}

describe('optionalAuthenticate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets currentUser when a valid token is present', async () => {
    mockVerify.mockReturnValue({ userId: 'u1', role: 'student' });
    mockUserFindById.mockResolvedValue({ _id: 'u1', isActive: true });

    const req = makeReq('Bearer valid.token');
    const next = jest.fn();
    await optionalAuthenticate(req, {} as any, next);

    expect(req.currentUser).toEqual({ userId: 'u1', role: 'student' });
    expect(next).toHaveBeenCalledWith();
  });

  it('leaves currentUser unset when no Authorization header is sent (anonymous)', async () => {
    const req = makeReq();
    const next = jest.fn();
    await optionalAuthenticate(req, {} as any, next);

    expect(req.currentUser).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('never rejects the request on an invalid/expired token — falls back to anonymous', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req = makeReq('Bearer bad.token');
    const next = jest.fn();
    await optionalAuthenticate(req, {} as any, next);

    expect(req.currentUser).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('does not attach currentUser for a deactivated user', async () => {
    mockVerify.mockReturnValue({ userId: 'u1' });
    mockUserFindById.mockResolvedValue({ _id: 'u1', isActive: false });

    const req = makeReq('Bearer valid.token');
    const next = jest.fn();
    await optionalAuthenticate(req, {} as any, next);

    expect(req.currentUser).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});

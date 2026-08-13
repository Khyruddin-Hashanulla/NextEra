import mongoose from 'mongoose';
import { AuditLog } from '../models/auditLog.model';
import { auditService } from '../services/audit.service';

jest.mock('../models/auditLog.model');

function makeChain(leanResult: any[] = []) {
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(leanResult),
  };
}

describe('AuditService', () => {
  const mockCreate = AuditLog.create as jest.Mock;
  const mockFind = AuditLog.find as jest.Mock;
  const mockCountDocuments = AuditLog.countDocuments as jest.Mock;
  const mockDistinct = AuditLog.distinct as jest.Mock;

  const adminId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue(makeChain());
    mockCountDocuments.mockResolvedValue(0);
  });

  describe('log', () => {
    it('creates an audit log entry for a successful action', async () => {
      mockCreate.mockResolvedValue({ _id: 'log1' });
      await auditService.log({
        adminId,
        adminName: 'Admin User',
        adminEmail: 'admin@test.com',
        action: 'USER_CREATED',
        resourceType: 'User',
        resourceId: 'user123',
        requestMethod: 'POST',
        requestUrl: '/admin/users',
        statusCode: 201,
        success: true,
        ipAddress: '127.0.0.1',
      });
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const call = mockCreate.mock.calls[0][0];
      expect(call.action).toBe('USER_CREATED');
      expect(call.resourceType).toBe('User');
      expect(call.success).toBe(true);
    });

    it('creates an audit log entry for a failed action', async () => {
      mockCreate.mockResolvedValue({ _id: 'log2' });
      await auditService.log({
        adminId,
        adminName: 'Admin User',
        adminEmail: 'admin@test.com',
        action: 'USER_DELETED',
        resourceType: 'User',
        success: false,
        errorMessage: 'User not found',
        statusCode: 404,
      });
      const call = mockCreate.mock.calls[0][0];
      expect(call.action).toBe('USER_DELETED');
      expect(call.success).toBe(false);
      expect(call.errorMessage).toBe('User not found');
    });

    it('masks sensitive fields in previousData and newData', async () => {
      mockCreate.mockResolvedValue({ _id: 'log3' });
      await auditService.log({
        adminId,
        adminName: 'Admin',
        adminEmail: 'admin@test.com',
        action: 'USER_UPDATED',
        resourceType: 'User',
        previousData: { name: 'Old', email: 'old@test.com', password: 'secret123' },
        newData: { name: 'New', email: 'new@test.com', password: 'newSecret456' },
      });
      const call = mockCreate.mock.calls[0][0];
      expect(call.previousData.password).toBe('***REDACTED***');
      expect(call.newData.password).toBe('***REDACTED***');
      expect(call.previousData.name).toBe('Old');
      expect(call.newData.name).toBe('New');
    });

    it('auto-detects changed fields from previous and new data', async () => {
      mockCreate.mockResolvedValue({ _id: 'log4' });
      await auditService.log({
        adminId,
        adminName: 'Admin',
        adminEmail: 'admin@test.com',
        action: 'SETTINGS_UPDATED',
        resourceType: 'PlatformSettings',
        previousData: { commissionPercentage: 25, gstPercentage: 18 },
        newData: { commissionPercentage: 30, gstPercentage: 18 },
      });
      const call = mockCreate.mock.calls[0][0];
      expect(call.changedFields).toContain('commissionPercentage');
      expect(call.changedFields).not.toContain('gstPercentage');
    });

    it('parses user agent into browser, OS, and device type', async () => {
      mockCreate.mockResolvedValue({ _id: 'log5' });
      await auditService.log({
        adminId,
        adminName: 'Admin',
        adminEmail: 'admin@test.com',
        action: 'ADMIN_LOGIN',
        resourceType: 'Auth',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const call = mockCreate.mock.calls[0][0];
      expect(call.browser).toBe('Chrome');
      expect(call.operatingSystem).toBe('macOS');
      expect(call.deviceType).toBe('Desktop');
    });

    it('never throws — fire-and-forget on failure', async () => {
      mockCreate.mockRejectedValue(new Error('DB error'));
      await expect(
        auditService.log({
          adminId,
          adminName: 'Admin',
          adminEmail: 'admin@test.com',
          action: 'TEST',
          resourceType: 'Test',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('search', () => {
    it('returns paginated results with default params', async () => {
      mockFind.mockReturnValue(makeChain([{ _id: 'log1', action: 'USER_CREATED' }]));
      mockCountDocuments.mockResolvedValue(1);

      const result = await auditService.search({ page: 1, limit: 20 });
      expect(result.logs).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.pages).toBe(1);
    });

    it('filters by action and resourceType', async () => {
      await auditService.search({ action: 'USER_DELETED', resourceType: 'User' });
      const query = mockFind.mock.calls[0][0];
      expect(query.action).toBe('USER_DELETED');
      expect(query.resourceType).toBe('User');
    });

    it('filters by success', async () => {
      await auditService.search({ success: false });
      const query = mockFind.mock.calls[0][0];
      expect(query.success).toBe(false);
    });

    it('excludes soft-deleted logs', async () => {
      await auditService.search({});
      const query = mockFind.mock.calls[0][0];
      expect(query.deletedAt).toBeNull();
    });

    it('adds search keyword as $or across multiple fields', async () => {
      await auditService.search({ search: 'admin@test' });
      const query = mockFind.mock.calls[0][0];
      expect(query.$or).toBeDefined();
      expect(query.$or.length).toBeGreaterThan(0);
    });

    it('builds correct date range filter', async () => {
      await auditService.search({ startDate: '2025-01-01', endDate: '2025-12-31' });
      const query = mockFind.mock.calls[0][0];
      expect(query.timestamp.$gte).toEqual(new Date('2025-01-01'));
      expect(query.timestamp.$lte).toEqual(new Date('2025-12-31'));
    });

    it('sorts by createdAt descending by default', async () => {
      const sortMock = jest.fn().mockReturnThis();
      mockFind.mockReturnValue({
        ...makeChain(),
        sort: sortMock,
      });

      await auditService.search({});
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('getActions', () => {
    it('returns a list of known audit actions excluding access_denied', async () => {
      const actions = await auditService.getActions();
      expect(actions).toContain('USER_CREATED');
      expect(actions).toContain('INSTRUCTOR_APPROVED');
      expect(actions).not.toContain('access_denied');
    });
  });

  describe('getResourceTypes', () => {
    it('returns sorted distinct resource types from logs', async () => {
      mockDistinct.mockResolvedValue(['User', 'Course', 'Category']);
      const types = await auditService.getResourceTypes();
      expect(types).toEqual(['Category', 'Course', 'User']);
    });
  });
});

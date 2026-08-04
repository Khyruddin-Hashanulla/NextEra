import { ApiResponse } from '../../../src/utils/ApiResponse';

describe('ApiResponse', () => {
  it('builds a success response', () => {
    const res = ApiResponse.success('OK', { id: 1 });
    expect(res.success).toBe(true);
    expect(res.message).toBe('OK');
    expect(res.data).toEqual({ id: 1 });
    expect(res.meta).toBeUndefined();
  });

  it('builds a success response with meta', () => {
    const res = ApiResponse.success('OK', [], { total: 10 });
    expect(res.success).toBe(true);
    expect(res.meta).toEqual({ total: 10 });
  });

  it('builds a created response without meta', () => {
    const res = ApiResponse.created('Created', { id: 2 });
    expect(res.success).toBe(true);
    expect(res.message).toBe('Created');
    expect(res.data).toEqual({ id: 2 });
    expect(res.meta).toBeUndefined();
  });

  it('builds a paginated response with meta', () => {
    const res = ApiResponse.paginated('List', [1, 2], { page: 1, limit: 20, totalPages: 1 });
    expect(res.success).toBe(true);
    expect(res.data).toEqual([1, 2]);
    expect(res.meta).toEqual({ page: 1, limit: 20, totalPages: 1 });
  });

  it('handles null data', () => {
    const res = ApiResponse.success('Empty', null);
    expect(res.data).toBeNull();
  });
});

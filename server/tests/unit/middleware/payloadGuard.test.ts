import { payloadGuard } from '../../../src/middlewares/payloadGuard.middleware';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

describe('payloadGuard middleware', () => {
  function run(body: unknown) {
    const req = mockRequest({ body });
    const res = mockResponse();
    const next = mockNext();
    payloadGuard(req, res as never, next);
    return { req, res, next };
  }

  it('passes through when the body is empty', () => {
    const { next } = run({});
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('passes through when there is no body', () => {
    const { next } = run(undefined);
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes through a shallow payload', () => {
    const { next } = run({ a: 1, b: 'two' });
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('rejects payloads that exceed the max nesting depth', () => {
    const deep = { l1: { l2: { l3: { l4: { l5: { l6: { l7: 1 } } } } } } };
    const { next } = run(deep);
    expect(next).toHaveBeenCalledOnce();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.message).toContain('maximum nesting depth of 6');
  });

  it('rejects payloads that exceed the max key count', () => {
    const wide: Record<string, unknown> = {};
    for (let i = 0; i < 101; i += 1) wide[`k${i}`] = i;
    const { next } = run(wide);
    expect(next).toHaveBeenCalledOnce();
    const err = next.mock.calls[0][0];
    expect(err.message).toContain('maximum field count of 100');
  });

  it('counts nested keys against the max key count', () => {
    const body: Record<string, unknown> = {};
    for (let i = 0; i < 60; i += 1) body[`k${i}`] = { a: 1, b: 2 };
    const { next } = run(body);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].message).toContain('maximum field count');
  });

  it('counts keys inside arrays against the max key count', () => {
    const body = { list: Array.from({ length: 60 }, () => ({ a: 1, b: 2 })) };
    const { next } = run(body);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].message).toContain('maximum field count');
  });

  it('treats arrays as nested structures when counting depth', () => {
    const body = { list: [1, [2, [3, [4, [5, [6, [7]]]]]]] };
    const { next } = run(body);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeDefined();
  });
});

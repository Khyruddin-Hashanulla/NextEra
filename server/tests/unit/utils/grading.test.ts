import { ApiError } from '../../../src/utils/ApiError';
import {
  isAssignmentStatus,
  computePercentage,
  computePassFail,
  computeLetterGrade,
  assertValidGrade,
  getDefaultMaxMarks,
  ASSIGNMENT_STATUSES,
} from '../../../src/utils/grading';

describe('isAssignmentStatus', () => {
  it('returns true for each valid status', () => {
    for (const status of ASSIGNMENT_STATUSES) {
      expect(isAssignmentStatus(status)).toBe(true);
    }
  });

  it('returns false for invalid inputs', () => {
    expect(isAssignmentStatus('bogus')).toBe(false);
    expect(isAssignmentStatus('')).toBe(false);
    expect(isAssignmentStatus(undefined)).toBe(false);
    expect(isAssignmentStatus(null)).toBe(false);
    expect(isAssignmentStatus(42)).toBe(false);
    expect(isAssignmentStatus({})).toBe(false);
  });
});

describe('computePercentage', () => {
  it('computes percentage rounded to two decimals', () => {
    expect(computePercentage(50, 100)).toBe(50);
    expect(computePercentage(25, 200)).toBe(12.5);
    expect(computePercentage(1, 3)).toBe(33.33);
  });

  it('returns 0 for zero max marks', () => {
    expect(computePercentage(10, 0)).toBe(0);
  });

  it('returns 0 for negative max marks', () => {
    expect(computePercentage(10, -5)).toBe(0);
  });

  it('returns 0 for non-finite max marks', () => {
    expect(computePercentage(10, NaN)).toBe(0);
    expect(computePercentage(10, Infinity)).toBe(0);
  });

  it('handles a perfect score', () => {
    expect(computePercentage(80, 80)).toBe(100);
  });
});

describe('computePassFail', () => {
  it('uses 60% default threshold when passingMarks is undefined', () => {
    expect(computePassFail(60, undefined, 100)).toBe('pass');
    expect(computePassFail(59, undefined, 100)).toBe('fail');
  });

  it('uses 60% default when passingMarks is zero or negative', () => {
    expect(computePassFail(60, 0, 100)).toBe('pass');
    expect(computePassFail(50, -1, 100)).toBe('fail');
  });

  it('passes exactly at the explicit threshold', () => {
    expect(computePassFail(70, 70, 100)).toBe('pass');
    expect(computePassFail(69, 70, 100)).toBe('fail');
  });

  it('treats grade equal to threshold as pass', () => {
    expect(computePassFail(30, 30, 100)).toBe('pass');
  });
});

describe('computeLetterGrade', () => {
  it.each([
    [100, 'A+'],
    [90, 'A+'],
    [89.9, 'A'],
    [80, 'A'],
    [79.9, 'B+'],
    [70, 'B+'],
    [69.9, 'B'],
    [60, 'B'],
    [59.9, 'C+'],
    [50, 'C+'],
    [49.9, 'C'],
    [40, 'C'],
    [39.9, 'D'],
    [33, 'D'],
    [32.9, 'F'],
    [0, 'F'],
    [-5, 'F'],
  ])('maps %p to %p', (percentage, grade) => {
    expect(computeLetterGrade(percentage)).toBe(grade);
  });
});

describe('assertValidGrade', () => {
  it('accepts valid grades', () => {
    expect(() => assertValidGrade(0, 100)).not.toThrow();
    expect(() => assertValidGrade(100, 100)).not.toThrow();
  });

  it('rejects negative grades', () => {
    expect(() => assertValidGrade(-1, 100)).toThrow(ApiError);
  });

  it('rejects non-finite grades', () => {
    expect(() => assertValidGrade(NaN, 100)).toThrow(ApiError);
    expect(() => assertValidGrade(Infinity, 100)).toThrow(ApiError);
  });

  it('rejects non-number grades', () => {
    expect(() => assertValidGrade('50' as unknown as number, 100)).toThrow(ApiError);
  });

  it('rejects non-positive max marks', () => {
    expect(() => assertValidGrade(50, 0)).toThrow(ApiError);
    expect(() => assertValidGrade(50, -10)).toThrow(ApiError);
    expect(() => assertValidGrade(50, NaN)).toThrow(ApiError);
  });

  it('rejects grade above max marks', () => {
    expect(() => assertValidGrade(101, 100)).toThrow(ApiError);
  });
});

describe('getDefaultMaxMarks', () => {
  it('uses lecture totalMarks when positive', () => {
    expect(getDefaultMaxMarks({ assignment: { totalMarks: 50 } })).toBe(50);
  });

  it('falls back when totalMarks is missing or invalid', () => {
    expect(getDefaultMaxMarks(null)).toBe(100);
    expect(getDefaultMaxMarks({})).toBe(100);
    expect(getDefaultMaxMarks({ assignment: {} })).toBe(100);
    expect(getDefaultMaxMarks({ assignment: { totalMarks: 0 } })).toBe(100);
    expect(getDefaultMaxMarks({ assignment: { totalMarks: -5 } })).toBe(100);
  });

  it('uses a custom fallback', () => {
    expect(getDefaultMaxMarks(null, 50)).toBe(50);
  });
});

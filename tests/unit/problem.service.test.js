/**
 * Unit tests for problem.service.js
 */

import { jest } from '@jest/globals';

const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockCountDocuments = jest.fn();

jest.unstable_mockModule('../../src/models/problem.model.js', () => ({
  Problem: {
    find: mockFind,
    findOne: mockFindOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    countDocuments: mockCountDocuments,
  },
}));

const { listProblems, getProblem, updateProblem } = await import(
  '../../src/services/problem.service.js'
);

describe('problem.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listProblems', () => {
    it('returns paginated published problems', async () => {
      const fakeProblems = [{ slug: 'two-sum', title: 'Two Sum' }];
      mockFind.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(fakeProblems),
      });
      mockCountDocuments.mockResolvedValue(1);

      const result = await listProblems({ page: 1, limit: 20 });

      expect(result.problems).toEqual(fakeProblems);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('getProblem', () => {
    it('throws 404 when problem is not found', async () => {
      mockFindOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await expect(getProblem('non-existent')).rejects.toMatchObject({ status: 404 });
    });

    it('returns the problem when found', async () => {
      const fakeProblem = { slug: 'two-sum', title: 'Two Sum' };
      mockFindOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeProblem) });

      const problem = await getProblem('two-sum');
      expect(problem).toEqual(fakeProblem);
    });
  });

  describe('updateProblem', () => {
    it('throws 404 when problem to update is not found', async () => {
      mockFindOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await expect(updateProblem('missing', { title: 'New Title' })).rejects.toMatchObject({
        status: 404,
      });
    });

    it('returns updated problem on success', async () => {
      const updated = { slug: 'two-sum', title: 'Updated Title' };
      mockFindOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(updated) });

      const result = await updateProblem('two-sum', { title: 'Updated Title' });
      expect(result).toEqual(updated);
    });
  });
});

import { Submission } from '../../src/models/submission.model.js';
import { Problem } from '../../src/models/problem.model.js';
import { runInSandbox } from '../runners/docker.runner.js';
import { logger } from '../../src/config/logger.js';

/**
 * Compare actual output to expected, trimming trailing whitespace.
 */
function judgeOutput(actual, expected) {
  const normalize = (s) => s.replace(/\r\n/g, '\n').trimEnd();
  return normalize(actual) === normalize(expected);
}

/**
 * BullMQ processor: judges a single submission.
 *
 * Flow:
 *  1. Fetch submission and problem (with test cases) from DB
 *  2. Mark submission as 'running'
 *  3. Run code against each test case via Docker sandbox
 *  4. Aggregate verdict (first failure wins)
 *  5. Persist final status + per-test results
 *  6. Emit Socket.IO event to the submitter's room
 */
export async function processSubmission(job, io) {
  const { submissionId } = job.data;

  let submission;
  try {
    submission = await Submission.findById(submissionId).select('+code');
    if (!submission) {
      logger.warn({ submissionId }, 'Submission not found, skipping job');
      return;
    }

    const problem = await Problem.findById(submission.problemId);
    if (!problem) {
      await finalizeSubmission(submission, 'internal_error', [], io);
      return;
    }

    // Mark as running
    submission.status = 'running';
    await submission.save();

    const results = [];
    let finalStatus = 'accepted';
    let maxTime = 0;
    let maxMemory = 0;

    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];

      let result;
      try {
        result = await runInSandbox({
          language: submission.language,
          code: submission.code,
          input: tc.input,
          timeLimit: problem.timeLimit,
          memoryLimit: problem.memoryLimit,
        });
      } catch (sandboxErr) {
        logger.error({ sandboxErr, submissionId, testCaseIndex: i }, 'Sandbox error');
        results.push({ testCaseIndex: i, status: 'runtime_error', stderr: sandboxErr.message });
        finalStatus = 'internal_error';
        break;
      }

      let tcStatus;
      if (result.compilationError) {
        tcStatus = 'runtime_error'; // maps to compilation_error at submission level
        finalStatus = 'compilation_error';
        results.push({
          testCaseIndex: i,
          status: tcStatus,
          stderr: result.stderr?.slice(0, 2000),
        });
        break;
      } else if (result.timedOut) {
        tcStatus = 'time_limit_exceeded';
      } else if (result.exitCode !== 0) {
        tcStatus = 'runtime_error';
      } else if (!judgeOutput(result.stdout, tc.expectedOutput)) {
        tcStatus = 'wrong_answer';
      } else {
        tcStatus = 'accepted';
      }

      const tcResult = {
        testCaseIndex: i,
        status: tcStatus,
        executionTime: result.executionTime ?? 0,
        memoryUsed: result.memoryUsed ?? 0,
        stderr: tcStatus !== 'accepted' ? result.stderr?.slice(0, 500) : undefined,
      };
      results.push(tcResult);

      maxTime = Math.max(maxTime, tcResult.executionTime ?? 0);
      maxMemory = Math.max(maxMemory, tcResult.memoryUsed ?? 0);

      if (tcStatus !== 'accepted') {
        finalStatus = tcStatus;
        break; // Stop on first failure
      }
    }

    const score =
      finalStatus === 'accepted'
        ? 100
        : Math.floor((results.filter((r) => r.status === 'accepted').length / problem.testCases.length) * 100);

    await finalizeSubmission(submission, finalStatus, results, io, maxTime, maxMemory, score);

    logger.info({ submissionId, finalStatus, score }, 'Submission judged');
  } catch (err) {
    logger.error({ err, submissionId }, 'Unexpected error in submission processor');
    if (submission) {
      await finalizeSubmission(submission, 'internal_error', [], io).catch(() => {});
    }
    throw err; // Let BullMQ handle retry
  }
}

async function finalizeSubmission(submission, status, results, io, executionTime = 0, memoryUsed = 0, score = 0) {
  submission.status = status;
  submission.results = results;
  submission.executionTime = executionTime;
  submission.memoryUsed = memoryUsed;
  submission.score = score;
  await submission.save();

  // Emit real-time verdict to the submitter's Socket.IO room
  if (io) {
    io.to(`user:${submission.userId.toString()}`).emit('verdict', {
      submissionId: submission._id.toString(),
      status,
      score,
      executionTime,
      memoryUsed,
      results,
    });
  }
}

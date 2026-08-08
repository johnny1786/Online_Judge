import mongoose from 'mongoose';

const verdictResultSchema = new mongoose.Schema(
  {
    testCaseIndex: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'accepted',
        'wrong_answer',
        'time_limit_exceeded',
        'memory_limit_exceeded',
        'runtime_error',
      ],
      required: true,
    },
    executionTime: { type: Number }, // ms
    memoryUsed: { type: Number },    // MB
    stderr: { type: String },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    language: {
      type: String,
      enum: ['cpp', 'python', 'javascript'],
      required: true,
    },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'queued',
        'running',
        'accepted',
        'wrong_answer',
        'time_limit_exceeded',
        'memory_limit_exceeded',
        'runtime_error',
        'compilation_error',
        'internal_error',
      ],
      default: 'queued',
    },
    results: [verdictResultSchema],  // per-test-case results
    executionTime: { type: Number }, // max across test cases
    memoryUsed: { type: Number },    // max across test cases
    score: { type: Number, default: 0 }, // percentage of passed test cases
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.code; // Don't expose code in list views by default
        return ret;
      },
    },
  }
);

// Indexes
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ problemId: 1, status: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);

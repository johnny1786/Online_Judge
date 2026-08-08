import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
  },
  { _id: true }
);

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: true }
);

const problemSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    tags: [{ type: String, trim: true }],
    timeLimit: { type: Number, default: 2000 },   // milliseconds
    memoryLimit: { type: Number, default: 256 },  // MB
    examples: [exampleSchema],                    // public examples
    testCases: [testCaseSchema],                  // private (judge) test cases
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    solveCount: { type: Number, default: 0 },
    attemptCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Never expose test cases in JSON output
        delete ret.testCases;
        return ret;
      },
    },
  }
);

// Indexes
problemSchema.index({ status: 1, difficulty: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ status: 1, slug: 1 });

export const Problem = mongoose.model('Problem', problemSchema);

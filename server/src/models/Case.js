import mongoose from 'mongoose'

const suspectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    description: { type: String, required: true },
    alibi: { type: String, required: true },
    motive: { type: String, required: true },
  },
  { _id: false }
)

const clueSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    pointsTo: { type: [String], default: [] }, // PRIVATE
  },
  { _id: false }
)

const hintSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
)

const caseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    premise: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    story: { type: String, required: true },
    suspects: { type: [suspectSchema], required: true },
    clues: { type: [clueSchema], required: true },
    hints: { type: [hintSchema], required: true },
    solution: {
      // PRIVATE
      culpritId: { type: String, required: true },
      explanation: { type: String, required: true },
    },
    progress: {
      discoveredClueIds: { type: [String], default: [] },
      hintsUsed: { type: Number, default: 0 },
    },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    accusation: {
      suspectId: String,
      correct: Boolean,
      submittedAt: Date,
    },
    score: {
      base: Number,
      clueBonus: Number,
      hintPenalty: Number,
      total: Number,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Case', caseSchema)
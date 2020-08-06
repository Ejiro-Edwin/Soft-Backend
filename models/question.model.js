const { Schema, model } = require('mongoose')
const QuestionSchema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { type: Schema.Types.String, required: true },
    text: { type: Schema.Types.String },
    votes: { type: Schema.Types.Number, default: 0 },
    tags: [{ type: Schema.Types.String }],
    __v: { type: Number, select: false }
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

const Question = model('Question', QuestionSchema)

module.exports = Question

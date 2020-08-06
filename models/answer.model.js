const { Schema, model } = require('mongoose')
const AnswerSchema = new Schema(
  {
    question: { 
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    user: { 
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: { type: Schema.Types.String },
    votes: { type: Schema.Types.Number, default: 0 },
    __v: { type: Number, select: false }
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

const Answer = model('Answer', AnswerSchema)

module.exports = Answer

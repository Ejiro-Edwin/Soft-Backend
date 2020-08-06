const { Schema, model } = require('mongoose')
const CommentSchema = new Schema(
  {
    root: { 
      type: Schema.Types.String,
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

const Comment = model('Comment', CommentSchema)

module.exports = Comment

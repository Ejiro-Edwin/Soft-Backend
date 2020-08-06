const { Schema, model } = require('mongoose')
const SubscribeSchema = new Schema(
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
    __v: { type: Number, select: false }
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

const Subscribe = model('Subscribe', SubscribeSchema)

module.exports = Subscribe

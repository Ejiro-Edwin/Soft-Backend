const { Schema, model } = require('mongoose')
const bcrypt = require('bcryptjs')
const UserType = Object.freeze({
  USER: 'User',
  ADMIN: 'Admin'
})

const UserSchema = new Schema(
  {
    // Personal Details
    username: { type: Schema.Types.String },
    email: { type: Schema.Types.String },
    identifier: { type: Schema.Types.String },
    // Access levels
    type: { type: Schema.Types.String, enum: Object.values(UserType), default: UserType.USER, required: true },
    // Authentication
    // activated: { type: Schema.Types.Boolean, required: true },
    password: { type: Schema.Types.String, required: true, select: false },
    token: { type: Schema.Types.String, select: true }, // JWT token
    recover_token: { type: Schema.Types.String, select: false },
    __v: { type: Number, select: false }
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

UserSchema.statics.UserType = UserType

UserSchema.pre('save', async function pre(next) {
  if (this.isNew) {
    const hashedPassword = bcrypt.hashSync(this.password, bcrypt.genSaltSync(5), null)
    this.password = hashedPassword
    this.type = UserType.USER
  }
  next();
});

UserSchema.methods.encrypt = function encrypt(text) {
  return bcrypt.hashSync(text, bcrypt.genSaltSync(5), null)
}

UserSchema.methods.validatePassword = function validatePassword(password) {
  return bcrypt.compareSync(password, this.password)
}

UserSchema.methods.validateToken = function validateToken(token) {
  return bcrypt.compareSync(token, this.recover_token)
}
const User = model('User', UserSchema)

module.exports = User

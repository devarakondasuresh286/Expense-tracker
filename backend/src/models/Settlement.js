import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { timestamps: true },
);

settlementSchema.index({ group: 1, fromUser: 1, toUser: 1, createdAt: -1 });

const Settlement = mongoose.model('Settlement', settlementSchema);

export default Settlement;

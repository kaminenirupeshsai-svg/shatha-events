import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const TaskSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    title: { type: String, required: true, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
  },
  { timestamps: true },
);

export type TaskDoc = HydratedDocument<InferSchemaType<typeof TaskSchema>>;

export const Task = model('Task', TaskSchema);

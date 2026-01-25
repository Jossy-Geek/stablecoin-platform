import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailDocument = Email & Document;

@Schema({
  collection: 'emails',
  timestamps: true,
})
export class Email {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  templateName: string;

  @Prop({ type: Object, default: {} })
  templateVariables: Record<string, any>;

  @Prop({ type: String, enum: ['sendgrid', 'mailgun'], default: 'sendgrid' })
  emailProvider: string;

  @Prop({ type: Boolean, required: true, default: false })
  isSent: boolean;

  @Prop({ type: Number, default: 0 })
  retry: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const EmailSchema = SchemaFactory.createForClass(Email);

// Create indexes for better query performance
EmailSchema.index({ userId: 1, createdAt: -1 });
EmailSchema.index({ isSent: 1, createdAt: -1 });
EmailSchema.index({ templateName: 1 });

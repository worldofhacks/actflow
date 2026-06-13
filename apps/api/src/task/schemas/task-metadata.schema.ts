import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MetadataDocument } from '../../common/services/MetadataDocument';
import { ServiceAddOn } from '../../core/types';

@Schema({ timestamps: true })
export class TaskMetadataDocument extends MetadataDocument {
  @Prop({ type: String, required: true })
  serviceName: string;

  @Prop({ type: String, required: true })
  prompt: string;

  @Prop({
    type: [
      {
        name: { type: String },
        price: { type: String },
      },
    ],
    default: [],
  })
  addOns: ServiceAddOn[];

  @Prop({ type: Boolean, default: true })
  isPlatformManaged: boolean;

  @Prop({ type: Boolean, default: true })
  isValid: boolean;
}

export const TaskMetadataSchema = SchemaFactory.createForClass(TaskMetadataDocument);
// TaskMetadataSchema.index({ isPlatformManaged: 1 });
// TaskMetadataSchema.index({ isValid: 1 });
// TaskMetadataSchema.index({ pricingModel: 1 });

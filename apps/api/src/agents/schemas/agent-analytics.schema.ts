import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SentimentBreakdown {
  @Prop({ type: Number, required: true, default: 0 })
  positivePercentage: number;

  @Prop({ type: Number, required: true, default: 0 })
  neutralPercentage: number;

  @Prop({ type: Number, required: true, default: 0 })
  negativePercentage: number;

  constructor(data?: Partial<SentimentBreakdown>) {
    if (data) {
      this.positivePercentage = data.positivePercentage ?? 0;
      this.neutralPercentage = data.neutralPercentage ?? 0;
      this.negativePercentage = data.negativePercentage ?? 0;
    }
  }
}
export const SentimentBreakdownSchema = SchemaFactory.createForClass(SentimentBreakdown);

@Schema({ _id: false })
export class SocialAnalyticsDocument {
  @Prop({ type: Number, required: false })
  followers: number;

  @Prop({ type: Number, required: false })
  following: number;

  @Prop({ type: Number, required: false })
  totalPosts: number;

  // Engagement metrics
  @Prop({ type: Number, required: false })
  averageLikes: number;

  @Prop({ type: Number, required: false })
  averageComments: number;

  @Prop({ type: Number, required: false })
  averageShares: number;

  @Prop({ type: Number, required: false })
  averageViews: number;

  @Prop({ type: Number, required: false })
  engagementRate: number;

  // Content analysis
  @Prop({ type: SentimentBreakdownSchema, required: false })
  commentSentiment: SentimentBreakdown;

  @Prop({ type: [String], required: false })
  interestCategories: string[];

  @Prop({ type: [String], required: false })
  genders: string[];

  @Prop({ type: [String], required: false })
  locations: string[];

  // Platform specific metrics
  @Prop({ type: Object, required: false })
  platformSpecificMetrics: Record<string, any>;

  // Verification and quality indicators
  @Prop({ type: Boolean, required: false, default: false })
  isVerified: boolean;

  @Prop({ type: Date, required: false })
  lastUpdated: Date;

  static Default: SocialAnalyticsDocument = {
    followers: 0,
    following: 0,
    totalPosts: 0,
    isVerified: false,
    lastUpdated: null,
    averageLikes: 0,
    averageComments: 0,
    averageShares: 0,
    averageViews: 0,
    engagementRate: 0,
    commentSentiment: new SentimentBreakdown(),
    interestCategories: [],
    genders: [],
    locations: [],
    platformSpecificMetrics: {},
  };
  constructor(data?: Partial<SocialAnalyticsDocument>) {
    if (data) {
      Object.assign(this, data);

      // Special handling for nested objects
      if (data.commentSentiment) {
        this.commentSentiment = new SentimentBreakdown(data.commentSentiment);
      }

      // Handle arrays
      if (data.interestCategories) {
        this.interestCategories = [...data.interestCategories];
      }

      if (data.genders) {
        this.genders = [...data.genders];
      }

      if (data.locations) {
        this.locations = [...data.locations];
      }
    }
  }
}

@Schema({ _id: false })
export class AgentRealtimeStatusDocument {
  @Prop({ type: Date, required: false })
  lastOnline?: Date;

  @Prop({ type: String, required: false })
  instanceId?: string;

  @Prop({ type: Number, required: false })
  lastProcessedBlock?: number;

  static Default: AgentRealtimeStatusDocument = {
    lastOnline: null,
    instanceId: null,
    lastProcessedBlock: null,
  };
}

export const SocialAnalyticsSchema = SchemaFactory.createForClass(SocialAnalyticsDocument);
export const AgentRealtimeStatusSchema = SchemaFactory.createForClass(AgentRealtimeStatusDocument);

@Schema({ _id: false })
export class AgentAnalyticsDocument {
  @Prop({ type: AgentRealtimeStatusSchema, required: false })
  realtimeStatus?: AgentRealtimeStatusDocument;

  @Prop({ type: SocialAnalyticsSchema, required: false })
  socialAnalytics?: SocialAnalyticsDocument;
}

export const AgentAnalyticsSchema = SchemaFactory.createForClass(AgentAnalyticsDocument);

import { model, models, Schema, type Document, type Model } from "mongoose";

export interface ProjectDocument extends Document {
  name: string;
  description: string;
  schemaVersion: number;
  components: unknown[];
  connections: unknown[];
  simulationSettings: Record<string, unknown>;
  publicShareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 1000 },
    schemaVersion: { type: Number, default: 1, min: 1 },
    components: { type: [Schema.Types.Mixed], default: [] },
    connections: { type: [Schema.Types.Mixed], default: [] },
    simulationSettings: { type: Schema.Types.Mixed, default: {} },
    publicShareToken: { type: String, unique: true, sparse: true, select: false },
  },
  { timestamps: true },
);

export default (
  (models.Project as Model<ProjectDocument> | undefined) ??
  model<ProjectDocument>("Project", projectSchema)
);

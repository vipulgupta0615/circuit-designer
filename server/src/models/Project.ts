import { model, models, Schema, type Document, type Model } from "mongoose";

export interface ProjectDocument extends Document {
  name: string;
  components: unknown[];
  connections: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    components: { type: [Schema.Types.Mixed], default: [] },
    connections: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

export default (
  (models.Project as Model<ProjectDocument> | undefined) ??
  model<ProjectDocument>("Project", projectSchema)
);

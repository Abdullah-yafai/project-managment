import mongoose from "mongoose";
import slugify from "slugify";

const { Schema, model } = mongoose;

const ProjectSchema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    org: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["active", "archived", "completed"], default: "active", },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    meta: {
        priority: { type: String, enum: ["low", "medium", "high"], default: "medium" }
    },
    startDate: { type: Date },
    endDate: { type: Date },
    visibility: { type: String, enum: ["private", "org", "public"], default: 'org' },
}, { timestamps: true });


// Auto-generate slug from name
ProjectSchema.pre("validate", function (next) {
    if (!this.slug && this.name) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});


ProjectSchema.index({ org: 1, slug: 1 }, { unique: true });

export const Project = model("Project", ProjectSchema)
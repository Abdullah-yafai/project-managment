import mongoose from "mongoose";
import slugify from "slugify";

const { Schema, model } = mongoose;


const OrganizationSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        plan: { type: String, enum: ["free", "pro", "platinum"], default: "free" },
        billingEmail: { type: String, lowercase: true, trim: true, default: null },
        settings: {
            timezone: { type: String, default: "UTC" },
            language: { type: String, default: "en" }
        }
    },
    { timestamps: true }
);


//auto generate slug
OrganizationSchema.pre('validate', function (next) {
    if (!this.slug && this.name) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next()
})

OrganizationSchema.index({ slug: 1 })

export const Organization = model("Organization", OrganizationSchema)
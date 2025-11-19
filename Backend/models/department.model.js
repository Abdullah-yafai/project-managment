import mongoose from "mongoose";

const { Schema, model } = mongoose;

const DepartmentSchema = new Schema({
    name: { type: String, required: true },
    org: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  default: null, },

}, { timestamps: true });

// Prevent duplicate department names inside the same organization
DepartmentSchema.index({ org: 1, name: 1 }, { unique: true });

// Optional: fast lookup by org
DepartmentSchema.index({ org: 1 });



export const Department = model("Department", DepartmentSchema)
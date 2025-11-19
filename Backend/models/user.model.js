import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String, required: true, unique: true, index: true, trim: true, lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: { type: String, required: true, select: false },
    org: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: false },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: false },
    role: { type: String, enum: ["owner", "admin", "manager", "employee"], default: "employee", },
    avatar: { type: String, default: null },

    isActive: { type: Boolean, default: true },

    lastLogin: { type: Date, default: null },
}, { timestamps: true });

//check password if edit so convert in hash before save call
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});


// check password verify 
UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// lastLogin Helper function
UserSchema.methods.touchLastLogin = function () {
    this.lastLogin = new Date();
    return this.save();
};

// generate token
UserSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email
    },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1d' }
    )
}





export const User = mongoose.model("User", UserSchema)
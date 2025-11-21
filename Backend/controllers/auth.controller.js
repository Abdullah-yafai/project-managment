import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Organization } from "../models/organization.model.js";
import { Department } from "../models/department.model.js";
import { UploadCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";


const Generatetokens = async (UserID) => {
    try {
        const user = await User.findById(UserID);
        const accessToken = user.generateAccessToken();

        await user.save({ validateBeforeSave: false })

        return { accessToken }
    } catch (error) {
        throw new ApiError(500, "token Not generated")
    }
}

const Register = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, email, password, org, department, role, createOrg, orgName, billingEmail, plan, orgSlug, avatar } = req.body;

        console.log(createOrg, 'createOrg')

        if (createOrg === true) {
            if (!name || !email || !password || !orgName || !billingEmail || !plan) return res.status(400).json({ message: "name, email, password,orgName,billingEmail,plan required" });
        } else {
            if (!name || !email || !password || !org || !role) return res.status(400).json({ message: "name, email, password,org,role required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) throw new ApiError(409, 'Email Already exist')


        let avatarImage = null;
        try {
            const avatarPath = req.files?.avatar?.[0]?.path; // same as your snippet

            if (avatarPath) {
                console.log(avatarPath, 'avatarPath')
                // call your helper - must return something like { url: "...", public_id: "..." }
                const uploadResult = await UploadCloudinary(avatarPath);
                // ensure upload succeeded
                if (!uploadResult || !uploadResult.url) {
                    // stop registration if upload failed
                    throw new ApiError(500, "Avatar upload failed");
                }
                avatarImage = uploadResult; // keep whole object if you want public_id too
            }
        } catch (err) {
            // bubble upload error as ApiError so registration does not continue
            if (err instanceof ApiError) throw err;
            console.log(err, 'avatar error')
            throw new ApiError(500, "Avatar upload failed");
        }

        let orgData;

        if (createOrg === true) {
            const [newOrg] = await Organization.create([{ name: orgName, slug: orgSlug, plan: plan, billingEmail: billingEmail }], { session })
            orgData = newOrg

        } else {
            // validate organization exists
            const orgExists = await Organization.findById(org);
            if (!orgExists) throw new ApiError(401, "Organization not found");

            // validate department + ensure it belongs to same org
            const deptExists = await Department.findOne({ _id: department, org: org });
            if (!deptExists)
                throw new ApiError(401, "Invalid department for this organization");
        }


        const newUser = new User({
            name, email, password, role: role || "employee",
            org: orgData?._id || org,
            department,
            isActive: true,
            lastLogin: null,
            avatar: avatarImage?.url || ""
        })
        await newUser.save({ session });
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(new ApiResponse('', 200, `${name} Register Successfully`))
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(401, error);
    }

})


const Login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(401, "email and password required");

    const findUser = await User.findOne({ email }).select("+password")
    if (!findUser) {
        throw new ApiError(404, 'Invalid Email')
    }

    // check if account active
    if (!findUser.isActive) throw new ApiError(401, "Account disabled. Contact admin.");


    console.log(password, 'checkPassword')
    const checkPassword = await findUser.isPasswordCorrect(password);
    if (!checkPassword) {
        throw new ApiError(404, 'Invalid Password')
    }


    findUser.lastLogin = new Date();
    await findUser.save();

    const { accessToken } = await Generatetokens(findUser._id)

    const loginUser = await User.findById(findUser._id).select('-password')

    return res.status(200).json(new ApiResponse({ user: loginUser, accessToken }, 200, 'LoggIn SuccessFully'))

})

const GetMe = asyncHandler(async (req, res) => {
    const user = req.user;
    console.log(user, 'kkkk')
    if (!user) throw new ApiError(401, 'Unauthoraize')

    const getuser = await User.findById(user?._id)
    return res.status(200).json(new ApiResponse(getuser, 200, 'Profile fetch'))
})

export { Register, Login, GetMe }
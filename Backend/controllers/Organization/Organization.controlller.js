import { Organization } from "../../models/organization.model.js";
import { ApiError } from "../../utils/apierror.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAll = asyncHandler(async (req, res) => {
    try {
        const Org = await Organization.find({}, { name: 1, slug: 1, plan: 1 }).lean();
        if (Org?.length === 0) throw new ApiError(404, "No Org Found")

        return res.status(200).json(new ApiResponse(Org, 200, 'All Org Fetch'))
    } catch (error) {
        throw new ApiError(404, error)
    }
})

export { getAll }
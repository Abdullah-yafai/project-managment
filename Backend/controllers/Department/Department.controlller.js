import { Department } from "../../models/department.model.js";
import { ApiError } from "../../utils/apierror.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getByOrgId = asyncHandler(async (req, res) => {
    const { orgId } = req.params
    try {
        if (!orgId) throw new ApiError(401, 'Org ID Required')


        const depart = await Department.find({ org: orgId }, { name: 1 }).lean();

        return res.status(200).json(new ApiResponse(depart, 200, depart?.length === 0 ? 'No Depart Found' : 'Depart Found'))
    } catch (error) {
        throw new ApiError(404, error)
    }
})

export { getByOrgId }
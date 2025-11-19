import { ApiError } from "../utils/apierror";

export const checkActive = (req, res, next) => {
    if (!req.user) throw new ApiError(401, "Unauthoraize")
    if (!req.user?.isActive) throw new ApiError(401, "Account disabled")

    next();
}

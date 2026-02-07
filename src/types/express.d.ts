import type { CustomJWTPayload } from "../utils/jwt.js";

declare global {
    namespace Express {
        interface Request {
            user?: CustomJWTPayload
        }
    }
}

export { };
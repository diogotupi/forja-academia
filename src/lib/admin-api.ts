import { getCurrentUser } from "./auth";
export async function assertAdminApi(){const user=await getCurrentUser();if(!user||user.role!=="ADMIN")throw new Error("ADMIN_REQUIRED");return user}

import { cache } from "react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth/config";

export const getAuthSession = cache(async () => getServerSession(authOptions));

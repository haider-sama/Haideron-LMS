import { AudienceEnum } from "../../../../../server/src/shared/enums";
import { useAuth } from "./useAuth";

interface UsePermissionsOptions {
    authorId?: string;
}

export function usePermissions({ authorId }: UsePermissionsOptions = {}) {
    const { user, isLoggedIn, hasCheckedAuth } = useAuth();

    const role = user?.role as AudienceEnum ?? AudienceEnum.Guest;
    const userId = user?.id ?? "";

    const isOwner = authorId ? userId === authorId : false;

    const isStudent = role === AudienceEnum.Student;
    const isDepartmentTeacher = role === AudienceEnum.DepartmentTeacher;
    const isDepartmentHead = role === AudienceEnum.DepartmentHead;
    const isAdmin = role === AudienceEnum.Admin;

    return {
        user,
        role,
        userId,
        isOwner,

        // Role-specific flags
        isStudent,
        isDepartmentTeacher,
        isDepartmentHead,
        isAdmin,

        // Auth state
        isLoggedIn,
        hasCheckedAuth,
    };
}

import { AudienceEnum } from "../../../server/src/shared/enums";
import { useAuth } from "./auth/useAuth";

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
    const isForumModerator = role === AudienceEnum.ForumModerator;
    const isForumCurator = role === AudienceEnum.ForumCurator;
    const isCommunityAdmin = role === AudienceEnum.CommunityAdmin;

    const canModerate = [
        AudienceEnum.Admin,
        AudienceEnum.CommunityAdmin,
        AudienceEnum.ForumModerator,
        AudienceEnum.ForumCurator,
    ].includes(role);

    const canManage = isOwner || canModerate;

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
        isForumModerator,
        isForumCurator,
        isCommunityAdmin,

        // Permissions
        canModerate,
        canManage,

        // Auth state
        isLoggedIn,
        hasCheckedAuth,
    };
}

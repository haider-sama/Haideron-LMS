import { AudienceEnum } from "../../../../server/src/shared/enums";

type BadgeVariant = "default" | "forum";
type BadgeSize = "xs" | "sm" | "md" | "lg";

export const useRoleBadge = (
    role: AudienceEnum,
    variant: BadgeVariant = "default",
    size: BadgeSize = "md"
) => {
    const roleLabels: Record<AudienceEnum, { top: string; bottom?: string }> = {
        [AudienceEnum.Guest]: { top: "USER" },
        [AudienceEnum.Student]: { top: "STUDENT" },
        [AudienceEnum.DepartmentTeacher]: { top: "TEACHER", bottom: "DEPT" },
        [AudienceEnum.DepartmentHead]: { top: "HEAD", bottom: "DEPT" },
        [AudienceEnum.Admin]: { top: "ADMIN", bottom: "SYSTEM" },
        [AudienceEnum.ForumModerator]: { top: "MODERATOR", bottom: "FORUM" },
        [AudienceEnum.ForumCurator]: { top: "CURATOR", bottom: "FORUM" },
        [AudienceEnum.CommunityAdmin]: { top: "ADMIN", bottom: "COMM" },
    };

    const roleColors: Record<
        AudienceEnum,
        { bgFrom: string; bgTo: string; text?: string }
    > = {
        [AudienceEnum.Guest]: {
            bgFrom: "#6c757d", // gray
            bgTo: "#495057",
        },
        [AudienceEnum.Student]: {
            bgFrom: "#0d6efd", // blue
            bgTo: "#0a58ca",
        },
        [AudienceEnum.DepartmentTeacher]: {
            bgFrom: "#20c997", // teal
            bgTo: "#198754",
        },
        [AudienceEnum.DepartmentHead]: {
            bgFrom: "#fd7e14", // orange
            bgTo: "#dc6803",
        },
        [AudienceEnum.Admin]: {
            bgFrom: "#dc3545", // red
            bgTo: "#a71d2a",
        },
        [AudienceEnum.ForumModerator]: {
            bgFrom: "#6f42c1", // purple
            bgTo: "#5936a3",
        },
        [AudienceEnum.ForumCurator]: {
            bgFrom: "#d63384", // pink
            bgTo: "#b02a6f",
        },
        [AudienceEnum.CommunityAdmin]: {
            bgFrom: "#198754", // green
            bgTo: "#146c43",
        },
    };

    const label = roleLabels[role] || { top: "UNKNOWN" };
    const colors = roleColors[role] || {
        bgFrom: "#6c757d",
        bgTo: "#495057",
    };

    const scaleClass = {
        xs: "scale-[0.6]",
        sm: "scale-75",
        md: "scale-100",
        lg: "scale-125",
    }[size];

    const RoleBadge = () => (
        <div className={`relative inline-flex flex-col items-center ${scaleClass}`}>
            <div
                className="badge-bg w-40 h-12 rounded-md flex items-center justify-center border-2 border-gray-500 shadow-lg relative overflow-hidden"
                style={{
                    backgroundImage: `linear-gradient(to bottom, ${colors.bgFrom}, ${colors.bgTo})`,
                }}
            >
                <span className="developer-text text-xl font-bold z-10 tracking-wider">
                    {label.top}
                </span>
            </div>
            {label.bottom && (
                <div className="absolute bottom-[-12px] z-20">
                    <div className="staff-tag w-20 h-6 flex items-center justify-center">
                        <span className="staff-text text-xs font-bold italic tracking-wide">
                            {label.bottom}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );

    return { RoleBadge };
};

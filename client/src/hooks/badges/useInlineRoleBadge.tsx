import { AudienceEnum } from "../../../../server/src/shared/enums";

export const useInlineRoleBadge = (role: AudienceEnum) => {
    const roleStyles: Record<
        AudienceEnum,
        { bg: string; text: string; border: string }
    > = {
        [AudienceEnum.Guest]: {
            bg: "#f1f3f5",
            text: "#495057",
            border: "#ced4da",
        },
        [AudienceEnum.Student]: {
            bg: "#e7f1ff",
            text: "#0d6efd",
            border: "#b6d4fe",
        },
        [AudienceEnum.DepartmentTeacher]: {
            bg: "#e6fffa",
            text: "#198754",
            border: "#b2f2e6",
        },
        [AudienceEnum.DepartmentHead]: {
            bg: "#fff4e6",
            text: "#fd7e14",
            border: "#ffd8a8",
        },
        [AudienceEnum.Admin]: {
            bg: "#ffe3e3",
            text: "#dc3545",
            border: "#f1aeb5",
        },
        [AudienceEnum.ForumModerator]: {
            bg: "#f3f0ff",
            text: "#6f42c1",
            border: "#d0bfff",
        },
        [AudienceEnum.ForumCurator]: {
            bg: "#fff0f6",
            text: "#d63384",
            border: "#faa2c1",
        },
        [AudienceEnum.CommunityAdmin]: {
            bg: "#e9fbee",
            text: "#198754",
            border: "#b2f2bb",
        },
    };

    const { bg, text, border } = roleStyles[role] || {
        bg: "#f8f9fa",
        text: "#495057",
        border: "#dee2e6",
    };

    const className = `
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize
    `.trim();

    const style: React.CSSProperties = {
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
    };

    return { className, style };
};

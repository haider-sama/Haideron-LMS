import { ForumStatusEnum } from "../../../../server/src/shared/social.enums";

interface StatusBadge {
    label: string;
    className: string;
}

type StatusType = ForumStatusEnum | string;

const statusLabel = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

export const useStatusBadge = (status: StatusType): StatusBadge => {
    const badgeMap: Record<string, StatusBadge> = {
        [ForumStatusEnum.APPROVED]: {
            label: statusLabel(ForumStatusEnum.APPROVED),
            className: "bg-green-100 text-green-600",
        },
        [ForumStatusEnum.PENDING]: {
            label: statusLabel(ForumStatusEnum.PENDING),
            className: "bg-yellow-100 text-yellow-600",
        },
        [ForumStatusEnum.REJECTED]: {
            label: statusLabel(ForumStatusEnum.REJECTED),
            className: "bg-red-100 text-red-600",
        },
        // fallback for unknown values
        unknown: {
            label: statusLabel(status),
            className: "bg-gray-100 text-gray-600",
        },
    };

    return badgeMap[status] || badgeMap.unknown;
};

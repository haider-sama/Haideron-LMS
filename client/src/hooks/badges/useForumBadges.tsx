import { ForumBadgeEnum } from "../../../../server/src/shared/social.enums";
import { IconType } from "react-icons";
import { FiStar, FiMessageSquare, FiHeart, FiUsers, FiFileText } from "react-icons/fi";

export interface ForumBadge {
    key: ForumBadgeEnum;
    label: string;
    description: string;
    earned: boolean;
    icon?: IconType;
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
}

export const useForumBadges = (userBadges: ForumBadgeEnum[] = []): ForumBadge[] => {
    const allBadges: Omit<ForumBadge, "earned">[] = [
        {
            key: ForumBadgeEnum.ProPoster,
            label: "Pro Poster",
            description: "Created 50+ posts",
            icon: FiFileText,
            bgColor: "bg-blue-100",
            textColor: "text-blue-800",
            borderColor: "border-blue-300",
        },
        {
            key: ForumBadgeEnum.CommentMaster,
            label: "Comment Master",
            description: "Wrote 100+ comments",
            icon: FiMessageSquare,
            bgColor: "bg-purple-100",
            textColor: "text-purple-800",
            borderColor: "border-purple-300",
        },
        {
            key: ForumBadgeEnum.Beloved,
            label: "Beloved",
            description: "Received 200+ likes",
            icon: FiHeart,
            bgColor: "bg-pink-100",
            textColor: "text-pink-800",
            borderColor: "border-pink-300",
        },
        {
            key: ForumBadgeEnum.ForumLeader,
            label: "Forum Leader",
            description: "Joined 5+ forums",
            icon: FiUsers,
            bgColor: "bg-indigo-100",
            textColor: "text-indigo-800",
            borderColor: "border-indigo-300",
        },
        {
            key: ForumBadgeEnum.RisingStar,
            label: "Rising Star",
            description: "10+ reputation points",
            icon: FiStar,
            bgColor: "bg-yellow-100",
            textColor: "text-yellow-800",
            borderColor: "border-yellow-300",
        },
        {
            key: ForumBadgeEnum.ActiveContributor,
            label: "Active Contributor",
            description: "Posted actively for 7+ days",
            bgColor: "bg-green-100",
            textColor: "text-green-800",
            borderColor: "border-green-300",
        },
        {
            key: ForumBadgeEnum.Debater,
            label: "Debater",
            description: "25+ comments in threads",
            bgColor: "bg-red-100",
            textColor: "text-red-800",
            borderColor: "border-red-300",
        },
        {
            key: ForumBadgeEnum.Critic,
            label: "Critic",
            description: "50+ comment likes",
            bgColor: "bg-gray-200",
            textColor: "text-gray-800",
            borderColor: "border-gray-300",
        },
        {
            key: ForumBadgeEnum.PopularPoster,
            label: "Popular Poster",
            description: "100+ post likes",
            bgColor: "bg-orange-100",
            textColor: "text-orange-800",
            borderColor: "border-orange-300",
        },
        {
            key: ForumBadgeEnum.Veteran,
            label: "Veteran",
            description: "Been a member for over a year",
            bgColor: "bg-stone-100",
            textColor: "text-stone-800",
            borderColor: "border-stone-300",
        },
    ];

    return allBadges.map((badge) => ({
        ...badge,
        earned: userBadges.includes(badge.key),
    }));
};
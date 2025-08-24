import React from 'react';
import { format } from 'date-fns';
import {
    FiUser,
    FiType,
    FiStar,
    FiFileText,
    FiMessageSquare,
    FiHeart,
    FiAward,
    FiCalendar,
    FiClock,
} from 'react-icons/fi';
import { ForumBadgeEnum } from '../../../../../../server/src/shared/social.enums';
import { useForumBadges } from '../../../../hooks/badges/useForumBadges';
import { ForumProfile } from '../../../../constants/social/interfaces';

type UserForumStatsCardProps = {
    user: ForumProfile & Partial<{
        postCount: number;
        commentCount: number;
        interests: string[];
        joinedAt: string;
        lastOnline: string;
    }>;
};

const UserForumStatsCard: React.FC<UserForumStatsCardProps> = ({ user }) => {
    const stats = user;

    const isForumBadgeEnum = (value: string): value is ForumBadgeEnum => {
        return Object.values(ForumBadgeEnum).includes(value as ForumBadgeEnum);
    };

    const validBadges = (stats.badges ?? []).filter(isForumBadgeEnum);
    const badges = useForumBadges(validBadges);

    return (
        <div className="mt-8">
            <div className="bg-gray-100 p-4 border border-gray-300 rounded-md">
                {/* Heading */}
                <div className="px-1 mb-4">
                    <h3 className="text-sm font-semibold uppercase text-green-600 border-b border-gray-300 pb-1 w-full">
                        User Statistics
                    </h3>
                </div>

                {/* Definition list */}
                <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-700">
                    <Stat label="Username" value={stats.username} Icon={FiUser} />
                    <Stat label="Display Name" value={stats.displayName ?? "N/A"} Icon={FiType} />
                    <Stat label="Reputation" value={stats.reputation?.toString() ?? "0"} Icon={FiStar} />
                    <Stat label="Posts" value={stats.postCount?.toString() ?? "0"} Icon={FiFileText} />
                    <Stat label="Comments" value={stats.commentCount?.toString() ?? "0"} Icon={FiMessageSquare} />
                    <Stat label="Interests" value={stats.interests?.join(", ") ?? "None"} Icon={FiHeart} />

                    <dt className="flex items-center gap-2 font-medium text-gray-600 col-span-2 sm:col-span-1">
                        <FiAward className="text-green-600" />
                        Badges
                    </dt>
                    <dd className="flex flex-wrap gap-2 text-gray-800 col-span-2 sm:col-span-1">
                        {badges.filter(b => b.earned).length > 0 ? (
                            badges
                                .filter(b => b.earned)
                                .map((badge) => {
                                    const Icon = badge.icon || FiAward;
                                    return (
                                        <span
                                            key={badge.key}
                                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
                                            title={badge.description}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {badge.label}
                                        </span>
                                    );
                                })
                        ) : (
                            <span className="text-gray-500">None</span>
                        )}
                    </dd>

                    <Stat label="Joined" value={formatDate(stats.joinedAt ?? "")} Icon={FiCalendar} />
                    <Stat label="Last Online" value={formatDate(stats.lastOnline ?? "")} Icon={FiClock} />
                </dl>
            </div>
        </div>
    );
};

const Stat = ({
    label,
    value,
    Icon,
}: {
    label: string;
    value?: string;
    Icon: React.ComponentType<{ className?: string }>;
}) => (
    <>
        <dt className="flex items-center gap-2 font-medium text-gray-600">
            <Icon className="text-green-600" />
            {label}
        </dt>
        <dd className="text-gray-800">{value || '—'}</dd>
    </>
);

const formatDate = (iso: string) => {
    try {
        return format(new Date(iso), 'd MMM yyyy, h:mm a');
    } catch {
        return '—';
    }
};

export default UserForumStatsCard;

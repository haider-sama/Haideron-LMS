import { FiUsers, FiUser, FiLock, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { useStatusBadge } from "../../../../hooks/badges/useStatusBadges";
import { ForumWithDetails } from "../../../../constants/social/interfaces";

interface ForumInfoCardProps {
    forum: ForumWithDetails;
    memberCount: number;
}

const ForumInfoCard: React.FC<ForumInfoCardProps> = ({ forum, memberCount }) => {
    const { label, className } = useStatusBadge(forum.status);

    const createdAt = new Date(forum.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const createdBy =
        forum.creator?.firstName || forum.creator?.lastName
            ? `${forum.creator.firstName ?? ""} ${forum.creator.lastName ?? ""}`.trim()
            : forum.creator?.displayName ?? forum.creator?.username ?? forum.createdBy;
            
    return (
        <div className="bg-white rounded-sm border border-gray-300 p-4 w-full md:w-80 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
                About f/{forum.slug || forum.title.toLowerCase().replace(/\s+/g, "")}
            </h2>

            <p className="text-sm text-gray-600 mb-4">
                {forum.description || "No description available."}
            </p>

            <div className="text-sm text-gray-700 space-y-3 border-t border-gray-300 pt-4">
                <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-500" />
                    <span className="font-medium">Created:</span> {createdAt}
                </div>
                <div className="flex items-center gap-2">
                    <FiUser className="text-gray-500" />
                    <span className="font-medium">Created By:</span> {createdBy}
                </div>
                <div className="flex items-center gap-2">
                    <FiUsers className="text-gray-500" />
                    <span className="font-medium">Members:</span>{" "}
                    <span className="font-semibold text-gray-700">{memberCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <FiUsers className="text-gray-500" />
                    <span className="font-medium">Forum Type:</span>{" "}
                    <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wide">
                        {forum.type}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-gray-500" />
                    <span className="font-medium">Status:</span>{" "}
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${className}`}>
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <FiLock className={`text-gray-500`} />
                    <span className="font-medium">Archived:</span>{" "}
                    {forum.isArchived ? (
                        <span className="text-red-600 font-semibold">Yes</span>
                    ) : (
                        <span className="text-green-600 font-semibold">No</span>
                    )}
                </div>
            </div>

            {forum.moderators?.length > 0 && (
                <div className="mt-4 border-t border-gray-300 pt-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Moderators</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                        {forum.moderators.map((mod) => (
                            <li key={mod.id} className="pl-2 list-disc list-inside">
                                {mod.firstName} {mod.lastName}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ForumInfoCard;
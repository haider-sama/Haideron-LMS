import React from "react";
import { Link } from "react-router-dom";
import { ForumModerator } from "../../../../constants/social/interfaces";

interface ModeratorsListProps {
    moderators?: ForumModerator[];
    groupLeader: ForumModerator;
    forumSlug: string;
}

const ModeratorsList: React.FC<ModeratorsListProps> = ({ moderators = [], groupLeader, forumSlug }) => {
    return (
        <Link
            to={`/forums/${forumSlug}/moderators`}
            state={{ moderators, groupLeader }}
            className="text-blue-600 hover:underline text-xs mt-1 block"
        >
            View Moderators ({moderators.length + 1}) {/* +1 to count leader */}
        </Link>
    );
};

export default ModeratorsList;

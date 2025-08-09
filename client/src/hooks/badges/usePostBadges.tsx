import { FaThumbtack, FaImage, FaLink } from "react-icons/fa";
import { MdTextFields } from "react-icons/md";
import { BsQuestionCircle } from "react-icons/bs";
import { PostTypeEnum } from "../../../../server/src/shared/social.enums";

export const usePostBadges = (post: { isPinned: boolean; type: PostTypeEnum }) => {
    const badges: {
        label: string;
        icon: JSX.Element;
        className: string;
    }[] = [];

    if (post.isPinned) {
        badges.push({
            label: "Pinned",
            icon: <FaThumbtack className="text-yellow-500" />,
            className: "bg-yellow-100 text-yellow-800",
        });
    }

    const typeMap: Record<PostTypeEnum, { label: string; icon: JSX.Element; className: string }> = {
        [PostTypeEnum.TEXT]: {
            label: "Text",
            icon: <MdTextFields className="text-gray-600" />,
            className: "bg-gray-100 text-gray-800",
        },
        [PostTypeEnum.MEDIA]: {
            label: "Media",
            icon: <FaImage className="text-purple-500" />,
            className: "bg-purple-100 text-purple-800",
        },
        [PostTypeEnum.LINK]: {
            label: "Link",
            icon: <FaLink className="text-blue-500" />,
            className: "bg-blue-100 text-blue-800",
        },
        [PostTypeEnum.QUESTION]: {
            label: "Question",
            icon: <BsQuestionCircle className="text-red-500" />,
            className: "bg-red-100 text-red-800",
        },
    };

    const typeBadge = typeMap[post.type];
    if (typeBadge) {
        badges.push(typeBadge);
    }

    return badges;
};
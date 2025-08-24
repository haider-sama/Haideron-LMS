import { useMemo } from "react";
import { FiImage, FiUserPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ForumWithDetails } from "../../../../constants/social/interfaces";
import { useToast } from "../../../../context/ToastContext";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinForum, leaveForum } from "../../../../api/social/forum/forum-user-api";
import { Button } from "../../../ui/Button";

interface ForumHeaderProps {
    forum: ForumWithDetails;
}

const FORM_HEADER_PALETTES: string[][] = [
    ["from-yellow-400", "to-orange-300"],
    ["from-blue-500", "to-cyan-300"],
    ["from-green-400", "to-lime-300"],
    ["from-pink-400", "to-rose-300"],
    ["from-purple-500", "to-indigo-300"],
    ["from-red-400", "to-amber-300"],
    ["from-emerald-400", "to-teal-300"],
    ["from-fuchsia-500", "to-pink-300"],
    ["from-indigo-500", "to-sky-300"],
    ["from-violet-500", "to-purple-300"],
];

interface ForumHeaderProps {
    forum: ForumWithDetails;
    isMember: boolean;
    isLoading: boolean;
    onCreatePostClick: () => void;
}

const ForumHeader = ({ forum, isMember, isLoading,
    onCreatePostClick
}: ForumHeaderProps) => {

    const toast = useToast();
    const queryClient = useQueryClient();

    const { isLoggedIn } = usePermissions();
    const navigate = useNavigate();

    const [fromColor, toColor] = useMemo(() => {
        return FORM_HEADER_PALETTES[Math.floor(Math.random() * FORM_HEADER_PALETTES.length)];
    }, []);

    const handlePostClick = () => {
        isLoggedIn ? onCreatePostClick() : navigate("/login");
    };

    const joinMutation = useMutation({
        mutationFn: () => joinForum(forum.id),
        onSuccess: () => {
            toast.success("Joined forum");
            queryClient.invalidateQueries({ queryKey: ["forum-membership", forum.id] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to join forum");
        },
    });

    const leaveMutation = useMutation({
        mutationFn: () => leaveForum(forum.id),
        onSuccess: () => {
            toast.neutral("Left forum");
            queryClient.invalidateQueries({ queryKey: ["forum-membership", forum.id] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to leave forum");
        },
    });

    return (
        <div className="rounded-xl overflow-hidden mb-6 shadow">
            {/* Banner */}
            <div className={`h-32 w-full bg-gradient-to-br ${fromColor} ${toColor}`} />

            {/* White section */}
            <div className="flex items-center justify-between px-6 -mt-8 bg-white py-4 rounded-b-xl">
                {/* Left: Icon and Info */}
                <div className="flex items-center gap-4">
                    {forum.iconUrl ? (
                        <img
                            src={forum.iconUrl}
                            alt={`${forum.title} icon`}
                            className="w-16 h-16 rounded-md border-4 border-white object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-md bg-white border-4 border-white flex items-center justify-center text-gray-400 text-xl">
                            <FiImage />
                        </div>
                    )}

                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            f/{forum.slug || forum.title}
                        </h1>
                        <p className="text-sm text-gray-600 max-w-md">{forum.description}</p>
                    </div>
                </div>

                {/* Right: Buttons */}
                <div className="flex gap-2">
                    {!isLoggedIn && !isLoading && (
                        <button
                            onClick={() => navigate("/login")}
                            className="inline-flex items-center justify-center gap-2 px-2 py-1 bg-white border border-gray-300 text-gray-500
                            rounded shadow-sm text-sm hover:bg-gray-50 hover:border-gray-400 whitespace-nowrap"
                        >
                            <FiUserPlus className="text-sm" />
                            Login to Join
                        </button>
                    )}

                    {isLoggedIn && !isLoading && !isMember && (
                        <Button
                            onClick={() => joinMutation.mutate()}
                            isLoading={joinMutation.isPending}
                            loadingText="Joining..."
                            disabled={joinMutation.isPending}
                            size="sm"
                            variant="gray"
                            fullWidth={false}
                        >
                            Join
                        </Button>
                    )}

                    {isLoggedIn && !isLoading && isMember && (
                        <Button
                            onClick={() => leaveMutation.mutate()}
                            isLoading={leaveMutation.isPending}
                            loadingText="Leaving..."
                            disabled={leaveMutation.isPending}
                            size="sm"
                            variant="gray"
                            fullWidth={false}
                        >
                            Leave
                        </Button>
                    )}

                    <Button
                        onClick={handlePostClick}
                        disabled={!isLoggedIn}
                        size="sm"
                        variant="gray"
                        fullWidth={false}
                    >
                        {isLoggedIn ? "Create Post" : "Login to Create Post"}
                    </Button>

                </div>
            </div>
        </div>
    );
};

export default ForumHeader;
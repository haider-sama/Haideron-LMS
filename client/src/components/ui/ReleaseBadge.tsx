import { FC } from "react";

interface ReleaseBadgeData {
    text: string;
    borderColor: string;
    textColor: string;
    bgColor: string;
}

type ReleasePhase = "BETA" | "ALPHA" | "RC" | null;

const getReleaseBadge = (): ReleaseBadgeData | null => {
    const releasePhase = "BETA" as ReleasePhase;

    switch (releasePhase) {
        case "BETA":
            return {
                text: "BETA",
                borderColor: "border-yellow-300",
                textColor: "text-yellow-800",
                bgColor: "bg-yellow-50",
            };
        case "ALPHA":
            return {
                text: "ALPHA",
                borderColor: "border-pink-300",
                textColor: "text-pink-800",
                bgColor: "bg-pink-50",
            };
        case "RC":
            return {
                text: "RC",
                borderColor: "border-blue-300",
                textColor: "text-blue-800",
                bgColor: "bg-blue-50",
            };
        default:
            return null;
    }
};

export const ReleaseBadge: FC = () => {
    const badge = getReleaseBadge();
    if (!badge) return null;

    return (
        <span
            className={`ml-3 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.borderColor} ${badge.textColor} ${badge.bgColor}`}
        >
            {badge.text}
        </span>
    );
};

import { HiAcademicCap, HiLightBulb } from "react-icons/hi";
import { FaBullseye } from "react-icons/fa";
import { StudentPerformanceResponse } from "../../../../../constants/lms/intelligence-inter-types";
import { Badge, BadgeVariant } from "../../../../ui/Badge";

interface SummaryCardsProps {
    data: StudentPerformanceResponse;
}

export function SummaryCards({ data }: SummaryCardsProps) {
    const { courseGrades, cloPerformance, ploPerformance } = data;

    const validGpas = courseGrades
        .filter((c) => typeof c.gpa === "number")
        .map((c) => c.gpa!);
    const avgGpa = validGpas.length
        ? validGpas.reduce((sum, g) => sum + g, 0) / validGpas.length
        : null;

    const avgCLO = cloPerformance.length
        ? cloPerformance.reduce((sum, c) => sum + c.percentage, 0) / cloPerformance.length
        : null;

    const avgPLO = ploPerformance.length
        ? ploPerformance.reduce((sum, p) => sum + p.percentage, 0) / ploPerformance.length
        : null;

    const getStatus = (value: number | null, type: "gpa" | "percentage") => {
        if (value === null) return { label: "N/A", variant: "secondary" };
        if (type === "gpa") {
            if (value >= 3.5) return { label: "Excellent", variant: "success" };
            if (value >= 2.5) return { label: "Good", variant: "default" };
            if (value >= 2.0) return { label: "Low", variant: "warning" };
            return { label: "Critical", variant: "destructive" };
        } else {
            if (value >= 90) return { label: "Excellent", variant: "success" };
            if (value >= 75) return { label: "Good", variant: "default" };
            if (value >= 65) return { label: "Low", variant: "warning" };
            return { label: "Critical", variant: "destructive" };
        }
    };

    const summary = [
        {
            title: "Grade Average Point",
            icon: <HiAcademicCap className="text-blue-600 w-6 h-6" />,
            value: avgGpa !== null ? avgGpa.toFixed(2) : "N/A",
            denominator: "4.00",
            status: getStatus(avgGpa, "gpa"),
            isGpa: true,
        },
        {
            title: "CLO Achievement",
            icon: <HiLightBulb className="text-green-600 w-6 h-6" />,
            value: avgCLO !== null ? `${avgCLO.toFixed(1)}%` : "N/A",
            status: getStatus(avgCLO, "percentage"),
            isGpa: false,
        },
        {
            title: "PLO Achievement",
            icon: <FaBullseye className="text-purple-600 w-6 h-6" />,
            value: avgPLO !== null ? `${avgPLO.toFixed(1)}%` : "N/A",
            status: getStatus(avgPLO, "percentage"),
            isGpa: false,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {summary.map((card) => (
                <div
                    key={card.title}
                    className="rounded-2xl bg-white dark:bg-darkSurface border border-gray-200 dark:border-darkBorderLight
                 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                >
                    {/* Top Section */}
                    <div className="flex flex-col items-center text-center">
                        {card.icon}
                        <h3 className="text-sm text-muted-foreground dark:text-darkTextMuted font-medium mt-1">
                            {card.title}
                        </h3>

                        {/* GPA-specific layout */}
                        {card.isGpa ? (
                            <div className="mt-2 flex flex-col items-center">
                                <span className="text-5xl font-bold text-gray-800 dark:text-darkTextPrimary leading-tight">
                                    {card.value}
                                </span>
                                <span className="text-xs text-muted-foreground dark:text-darkTextMuted">
                                    / {card.denominator}
                                </span>
                            </div>
                        ) : (
                            <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-darkTextPrimary">
                                {card.value}
                            </p>
                        )}
                    </div>

                    {/* Bottom section */}
                    <div className="flex justify-end mt-4">
                        <Badge variant={card.status.variant as BadgeVariant}>
                            {card.status.label}
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    );
}

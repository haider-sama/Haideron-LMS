// import {
//     BarChart,
//     Bar,
//     Cell,
//     Tooltip,
//     ResponsiveContainer,
//     XAxis,
//     YAxis,
//     CartesianGrid,
// } from "recharts";
// import { useState } from "react";
// import { CLOPerformance } from "../../../../../constants/lms/intelligence-inter-types";

// type Props = {
//     cloPerformance: CLOPerformance[];
//     maxItems?: number;
//     showTitles?: boolean;
// };

// const getColor = (percentage: number) => {
//     if (percentage >= 90) return "#16a34a"; // Excellent - green
//     if (percentage >= 75) return "#2563eb"; // Good - blue
//     if (percentage >= 60) return "#facc15"; // Fair - yellow
//     return "#dc2626"; // Poor - red
// };

// const performanceLabels = [
//     { label: "Excellent (90%+)", color: "#16a34a" },
//     { label: "Good (75–89%)", color: "#2563eb" },
//     { label: "Fair (60–74%)", color: "#facc15" },
//     { label: "Poor (<60%)", color: "#dc2626" },
// ];

// export const CLOPerformanceChart: React.FC<Props> = ({
//     cloPerformance,
//     maxItems = 10,
// }) => {
//     const [_, setHoverIndex] = useState<number | null>(null);

//     const sorted = [...cloPerformance]
//         .sort((a, b) => b.percentage - a.percentage)
//         .slice(0, maxItems);

//     return (
//         <div className="rounded-2xl border border-gray-200 dark:border-darkBorderLight bg-white dark:bg-darkSurface shadow-sm p-6">
//             <div className="mb-4">
//                 <h2 className="text-lg font-semibold text-gray-900 dark:text-white">CLO Performance</h2>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                     Visual representation of CLO achievement across your courses.
//                 </p>
//             </div>

//             <div className="flex flex-wrap gap-3 mb-4 text-sm">
//                 {performanceLabels.map((item) => (
//                     <div key={item.label} className="flex items-center gap-2">
//                         <div
//                             className="w-4 h-4 rounded-sm"
//                             style={{ backgroundColor: item.color }}
//                         />
//                         <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
//                     </div>
//                 ))}
//             </div>

//             <ResponsiveContainer width="100%" height={300}>
//                 <BarChart
//                     data={sorted}
//                     layout="vertical"
//                     margin={{ top: 16, right: 24, left: 40, bottom: 16 }}
//                     onMouseLeave={() => setHoverIndex(null)}
//                 >
//                     <CartesianGrid strokeDasharray="2 2" stroke="#d1d5db" />

//                     <XAxis
//                         type="number"
//                         domain={[0, 100]}
//                         tickFormatter={(tick) => `${tick}%`}
//                         className="text-xs fill-gray-500 dark:fill-gray-400"
//                         axisLine={{ stroke: "#d1d5db" }}
//                         tickLine={{ stroke: "#d1d5db" }}
//                         stroke="#6b7280"
//                         label={{
//                             value: "Achievement (%)",
//                             position: "insideBottomRight",
//                             offset: -5,
//                             style: { fill: "#6b7280", fontSize: 12 },
//                         }}
//                     />

//                     <YAxis
//                         type="category"
//                         dataKey="cloTitle"
//                         className="text-xs fill-gray-500 dark:fill-gray-400"
//                         axisLine={{ stroke: "#d1d5db" }}
//                         tickLine={false}
//                         stroke="#6b7280"
//                         width={80}
//                         tickFormatter={(label: string) =>
//                             label.length > 10 ? `${label.slice(0, 9)}…` : label
//                         }
//                     />

//                     <Tooltip
//                         cursor={{ fill: "#f3f4f6" }}
//                         content={({ active, payload }) => {
//                             if (!active || !payload?.length) return null;
//                             const d = payload[0].payload;
//                             return (
//                                 <div className="bg-white dark:bg-darkMuted border border-gray-200 dark:border-darkBorderLight rounded-md shadow-md p-3 text-sm max-w-sm">
//                                     <div className="font-semibold text-gray-800 dark:text-white">{d.courseTitle}</div>
//                                     <div className="italic text-gray-500 dark:text-gray-400 mb-1">{d.cloTitle}</div>
//                                     <div className="text-gray-700 dark:text-gray-300 font-medium">
//                                         Score: {d.percentage.toFixed(1)}%
//                                     </div>
//                                 </div>
//                             );
//                         }}
//                     />

//                     <Bar dataKey="percentage" barSize={16}>
//                         {sorted.map((entry, index) => (
//                             <Cell key={index} fill={getColor(entry.percentage)} />
//                         ))}
//                     </Bar>
//                 </BarChart>
//             </ResponsiveContainer>
//         </div>

//     );
// };

// export default CLOPerformanceChart;
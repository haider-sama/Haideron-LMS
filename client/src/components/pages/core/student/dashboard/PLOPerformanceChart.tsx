// import {
//     ResponsiveContainer,
//     BarChart,
//     Bar,
//     XAxis,
//     YAxis,
//     Tooltip,
//     CartesianGrid,
//     Cell,
// } from "recharts";
// import { PLOPerformance } from "../../../../../constants/lms/intelligence-inter-types";

// interface Props {
//     ploPerformance: PLOPerformance[];
// }

// const getColor = (percentage: number) => {
//     if (percentage >= 85) return "#16a34a"; // green-600
//     if (percentage >= 70) return "#ca8a04"; // yellow-700
//     if (percentage >= 50) return "#ea580c"; // orange-600
//     return "#dc2626"; // red-600
// };

// const performanceLabels = [
//     { label: "Excellent (90%+)", color: "#16a34a" },
//     { label: "Good (75–89%)", color: "#2563eb" },
//     { label: "Fair (60–74%)", color: "#facc15" },
//     { label: "Poor (<60%)", color: "#dc2626" },
// ];

// const PLOPerformanceChart: React.FC<Props> = ({ ploPerformance }) => {
//     const data = ploPerformance.map((plo) => ({
//         ...plo,
//         name: plo.title,
//     }));

//     return (
//         <div className="rounded-2xl border border-gray-200 dark:border-darkBorderLight bg-white dark:bg-darkSurface shadow-sm p-6">
//             <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
//                 PLO Performance Summary
//             </h2>
//             <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
//                 An overview of how students are performing across PLOs.
//             </p>

//             {/* Legend */}
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
//                     data={data}
//                     layout="vertical"
//                     margin={{ top: 16, right: 24, left: 40, bottom: 16 }}
//                 >
//                     <CartesianGrid strokeDasharray="2 2" stroke="#d1d5db" />

//                     <XAxis
//                         type="number"
//                         domain={[0, 100]}
//                         tickFormatter={(tick) => `${tick}%`}
//                         className="text-xs fill-gray-500 dark:fill-gray-300"
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
//                         dataKey="name"
//                         className="text-xs fill-gray-500 dark:fill-gray-300"
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
//                         content={({ active, payload, label }) => {
//                             if (!active || !payload?.length) return null;
//                             const d = payload[0].payload;
//                             return (
//                                 <div className="bg-white dark:bg-darkMuted border border-gray-200 dark:border-darkBorderLight rounded-md shadow-md p-3 text-sm max-w-sm">
//                                     <div className="font-semibold text-gray-800 dark:text-white">PLO: {label}</div>
//                                     <div className="italic text-gray-500 dark:text-gray-400 mb-1">{d.ploTitle}</div>
//                                     <div className="text-gray-700 dark:text-gray-300 font-medium">
//                                         Achievement: {d.percentage.toFixed(1)}%
//                                     </div>
//                                 </div>
//                             );
//                         }}
//                     />

//                     <Bar dataKey="percentage" barSize={16}>
//                         {data.map((entry, index) => (
//                             <Cell key={index} fill={getColor(entry.percentage)} />
//                         ))}
//                     </Bar>
//                 </BarChart>
//             </ResponsiveContainer>
//         </div>

//     );
// };

// export default PLOPerformanceChart;

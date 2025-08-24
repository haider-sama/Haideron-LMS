// interface MetricProps {
//     icon: React.ReactNode;
//     label: string;
//     count: number | string;
//     highlight?: boolean;
//     onClick?: () => void;
//     disabled?: boolean;
// }

// export const Metric: React.FC<MetricProps> = ({ icon, label, count, highlight = false, onClick, disabled }) => {
//     const base = "flex items-center gap-1 sm:gap-1.5";
//     const textStyle = highlight ? "text-primary font-semibold" : "text-gray-700";

//     const content = (
//         <>
//             <span className="text-base">{icon}</span>
//             <span>{count}</span>
//             <span className="hidden sm:inline text-xs text-gray-500">{label}</span>
//         </>
//     );

//     return onClick ? (
//         <button
//             onClick={onClick}
//             disabled={disabled}
//             className={`${base} ${textStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
//             title={label}
//         >
//             {content}
//         </button>
//     ) : (
//         <div className={`${base} ${textStyle}`} title={label}>
//             {content}
//         </div>
//     );
// };

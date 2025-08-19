// import React, { useState } from 'react';
// import { GradingRule } from '../../../../constants/lms/interfaces';
// import { finalizeAssessmentResults, saveGradingScheme, withdrawFinalizedResult } from '../../../../api/lms/teacher/assessmentApi';
// import { useToast } from '../../../../context/ToastContext';
// import { ReadOnlyInput } from '../../../../components/account/Input';


// interface GradingFinalizationFormProps {
//     courseOfferingId: string;
//     section: string;
// }

// export const GradingFinalizationForm: React.FC<GradingFinalizationFormProps> = ({ courseOfferingId, section }) => {
//     const [gradingRules, setGradingRules] = useState<GradingRule[]>([
//         { grade: 'A+', minPercentage: 85, gradePoint: 4.0 },
//         { grade: 'A', minPercentage: 80, gradePoint: 4.0 },
//         { grade: 'A-', minPercentage: 75, gradePoint: 3.7 },
//         { grade: 'B+', minPercentage: 70, gradePoint: 3.3 },
//         { grade: 'B', minPercentage: 65, gradePoint: 3.0 },
//         { grade: 'B-', minPercentage: 60, gradePoint: 2.7 },
//         { grade: 'C+', minPercentage: 55, gradePoint: 2.3 },
//         { grade: 'C', minPercentage: 50, gradePoint: 2.0 },
//         { grade: 'C-', minPercentage: 45, gradePoint: 1.7 },
//         { grade: 'D+', minPercentage: 40, gradePoint: 1.3 },
//         { grade: 'D', minPercentage: 35, gradePoint: 1.0 },
//         { grade: 'F', minPercentage: 0, gradePoint: 0.0 },
//     ]);

//     const [savingScheme, setSavingScheme] = useState(false);
//     const [finalizingResults, setFinalizingResults] = useState(false);
//     const [withdrawingResults, setWithdrawingResults] = useState(false);
//     const toast = useToast();

//     const handleUpdateRule = (index: number, key: keyof GradingRule, value: string | number) => {
//         const updated = [...gradingRules];
//         if (key === 'grade') updated[index][key] = value as string;
//         else updated[index][key] = typeof value === 'string' ? parseFloat(value) || 0 : value;
//         setGradingRules(updated);
//     };

//     const handleSaveScheme = async () => {
//         setSavingScheme(true);
//         const response = await saveGradingScheme(courseOfferingId, gradingRules, section);
//         setSavingScheme(false);

//         if (response.success) toast.success(response.message);
//         else toast.error(response.message);
//     };

//     const handleFinalizeResults = async () => {
//         setFinalizingResults(true);
//         const response = await finalizeAssessmentResults(courseOfferingId, section);
//         setFinalizingResults(false);

//         if (response.success) {
//             toast.success(response.message);
//             console.log('Grades:', response.grades);
//         } else {
//             toast.error(response.message);
//         }
//     };

//     const handleWithdrawResults = async () => {
//         const firstConfirm = confirm(
//             "This will revoke the finalized result sent to the Department Head.\n\nAre you sure you want to continue?"
//         );
//         if (!firstConfirm) return;

//         const secondConfirm = confirm(
//             "After withdrawing, you must re-finalize the result before the Department Head can approve it.\n\nDo you still want to proceed?"
//         );
//         if (!secondConfirm) return;

//         try {
//             setWithdrawingResults(true);
//             const res = await withdrawFinalizedResult(courseOfferingId, section);

//             if (res.success) {
//                 toast.success(res.message);
//             } else {
//                 toast.error(res.message);
//             }
//         } catch (err) {
//             toast.error("Unexpected error occurred while withdrawing result.");
//         } finally {
//             setWithdrawingResults(false);
//         }
//     };

//     return (
//         <div className="p-6 bg-white dark:bg-darkSurface rounded-2xl space-y-6 w-full text-gray-800 dark:text-darkTextPrimary">
//             <h2 className="text-2xl font-bold text-center text-primary dark:text-darkTextPrimary">Custom Grading Scheme</h2>

//             <div className="space-y-6">
//                 {gradingRules.map((rule, index) => (
//                     <div
//                         key={index}
//                         className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-300 dark:border-darkBorderLight pb-4"
//                     >
//                         <div className="flex gap-2 items-center w-full md:w-1/3">
//                             <div className="w-20">
//                                 <label className="block text-xs font-medium text-gray-600 dark:text-darkTextMuted">Grade</label>
//                                 <ReadOnlyInput
//                                     value={rule.grade}
//                                     className="w-full text-center bg-gray-100 dark:bg-darkMuted text-black dark:text-darkTextPrimary"
//                                 />
//                             </div>

//                             <div className="w-20">
//                                 <label className="block text-xs font-medium text-gray-600 dark:text-darkTextMuted">GPA</label>
//                                 <ReadOnlyInput
//                                     value={rule.gradePoint}
//                                     className="w-full text-center bg-gray-100 dark:bg-darkMuted text-black dark:text-darkTextPrimary"
//                                 />
//                             </div>
//                         </div>

//                         <div className="flex-1">
//                             <label className="block text-sm font-medium text-gray-600 dark:text-darkTextMuted mb-1">
//                                 Min %: {rule.minPercentage}%
//                             </label>
//                             <input
//                                 type="range"
//                                 min={0}
//                                 max={100}
//                                 step={5}
//                                 value={rule.minPercentage}
//                                 onChange={(e) => handleUpdateRule(index, 'minPercentage', parseInt(e.target.value))}
//                                 className="w-full accent-primary"
//                             />
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
//                 <button
//                     onClick={handleSaveScheme}
//                     disabled={savingScheme}
//                     className={`px-4 py-2 rounded text-sm font-medium w-full sm:w-auto border border-gray-200 dark:border-darkBorderLight text-white ${savingScheme
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-primary hover:bg-white hover:text-primary dark:hover:bg-darkSurface dark:hover:text-primary'
//                         }`}
//                 >
//                     {savingScheme ? 'Saving...' : 'Save Grading Scheme'}
//                 </button>

//                 <button
//                     onClick={handleFinalizeResults}
//                     disabled={finalizingResults}
//                     className={`px-4 py-2 rounded text-sm font-medium w-full sm:w-auto border border-gray-200 dark:border-darkBorderLight text-white ${finalizingResults
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-green-600 hover:bg-white hover:text-green-600 dark:hover:bg-darkSurface dark:hover:text-green-600'
//                         }`}
//                 >
//                     {finalizingResults ? 'Finalizing...' : 'Finalize Results'}
//                 </button>

//                 <button
//                     onClick={handleWithdrawResults}
//                     disabled={withdrawingResults}
//                     className={`px-4 py-2 rounded text-sm font-medium w-full sm:w-auto border border-gray-200 dark:border-darkBorderLight text-white ${withdrawingResults
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-red-600 hover:bg-white hover:text-red-600 dark:hover:bg-darkSurface dark:hover:text-red-600'
//                         }`}
//                 >
//                     {withdrawingResults ? 'Withdrawing...' : 'Withdraw Finalized Result'}
//                 </button>
//             </div>
//         </div>
//     );
// };
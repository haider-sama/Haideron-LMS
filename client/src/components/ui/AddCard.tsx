import { FiPlus } from "react-icons/fi";

interface AddProgramCardProps {
  onClick: () => void;
  label?: string;
}

const AddCard: React.FC<AddProgramCardProps> = ({ onClick, label = "" }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center h-full min-h-[180px] border-2 
      border-dashed border-gray-300 dark:border-darkBorderLight 
      hover:border-blue-400 dark:hover:border-blue-500 
      hover:bg-blue-50 dark:hover:bg-darkMuted 
      transition-colors duration-200 rounded-2xl 
      text-gray-400 dark:text-darkTextMuted 
      hover:text-blue-500 dark:hover:text-blue-400 max-w-sm"
      title={label}
    >
      <FiPlus className="w-8 h-8 mb-2" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default AddCard;

import React from "react";

interface TopCenterLoaderProps {
  text?: string;
}

const TopCenterLoader: React.FC<TopCenterLoaderProps> = ({ text = "Loading..." }) => {
  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-gray-300 shadow-lg px-6 py-2 text-sm font-medium text-gray-700 animate-pulse">
        {text}
      </div>
    </div>
  );
};

export default TopCenterLoader;

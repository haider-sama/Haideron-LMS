import React from "react";
import { FiArrowLeft } from "react-icons/fi";
import { getButtonClass } from "../../components/ui/ButtonClass";

interface ErrorPageProps {
  code: number;
  heading: string;
  message: string;
  imageUrl?: string;
  homeUrl?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  code,
  heading,
  message,
  imageUrl,
  homeUrl = "/",
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center flex flex-col items-center">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Error"
            className="w-40 h-40 object-contain"
          />
        )}
        <h1 className="text-7xl font-bold text-gray-800">{code}</h1>
        <h2 className="text-2xl font-semibold text-gray-700">{heading}</h2>
        <p className="text-gray-600 max-w-md text-md leading-snug pt-2">{message}</p>

        <a
          href={homeUrl}
          className={getButtonClass({
            bg: "bg-blue-400",
            hoverBg: "hover:bg-white",
            text: "text-white",
            hoverText: "hover:text-gray-900",
            focusRing: "focus:ring-4 focus:ring-gray-200",
            extra: "flex items-center justify-center mx-auto mt-8",
          })}
        >
          <FiArrowLeft className="mr-2 text-lg" />
          Go Home
        </a>
      </div>
    </div>
  );
};

export default ErrorPage;

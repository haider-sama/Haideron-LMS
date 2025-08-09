import React from "react";

interface SpinnerProps {
  inline?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ inline = false }) => {
  if (inline) {
    return (
      <div
        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid 
                   border-current border-e-transparent text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-solid 
                   border-current border-e-transparent text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;

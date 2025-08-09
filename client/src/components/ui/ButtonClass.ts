import clsx from "clsx";

export const getButtonClass = ({
  bg = "bg-blue-400",
  hoverBg = "hover:bg-white",
  text = "text-white",
  hoverText = "hover:text-gray-900",
  focusRing = "focus:ring-4 focus:ring-gray-200",
  disabled = false,
  extra = "",
}: {
  bg?: string;
  hoverBg?: string;
  text?: string;
  hoverText?: string;
  focusRing?: string;
  disabled?: boolean;
  extra?: string;
}) =>
  clsx(
    "border border-gray-300 font-medium rounded text-sm px-4 py-2 focus:outline-none",
    disabled
      ? "bg-gray-400 text-white cursor-not-allowed"
      : [bg, hoverBg, text, hoverText, focusRing],
    extra
  );

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyEmailChange } from "../../../../api/auth/auth-api";
import { getButtonClass } from "../../../../components/ui/ButtonClass";
import { useToast } from "../../../../context/ToastContext";

const EmailChangeVerification: React.FC = () => {
    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
    const inputRefs = useRef<HTMLInputElement[]>([]);
    const navigate = useNavigate();
    const toast = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (index: number, value: string) => {
        const updatedCode = [...code];
        if (value.length > 1) {
            const sliced = value.slice(0, 6).split("");
            for (let i = 0; i < 6; i++) updatedCode[i] = sliced[i] || "";
            setCode(updatedCode);
            const next = updatedCode.findIndex((d) => d === "");
            inputRefs.current[next !== -1 ? next : 5].focus();
        } else {
            updatedCode[index] = value;
            setCode(updatedCode);
            if (value && index < 5) inputRefs.current[index + 1].focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newCode = Array(6).fill("").map((_, i) => pasted[i] || "");
        setCode(newCode);
        const nextIndex = newCode.findIndex((d) => d === "");
        inputRefs.current[nextIndex === -1 ? 5 : nextIndex]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = code.join("");
        setIsLoading(true);
        setError(null);

        try {
            await verifyEmailChange(token);
            toast.success("Email changed successfully!");
            navigate("/");
        } catch (err: any) {
            setError(err.message || "Verification failed.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (code.every((c) => c !== "")) {
            handleSubmit(new Event("submit") as unknown as React.FormEvent);
        }
    }, [code]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-darkPrimary">
            <div className="max-w-md w-full p-8 mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-center text-primary dark:text-darkTextPrimary">
                    Confirm Your New Email
                </h2>

                <p className="text-center text-gray-600 dark:text-darkTextSecondary mb-4">
                    Enter the 6-digit code sent to your new email address.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-between">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el!)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className="w-12 h-12 text-center text-2xl font-bold
                  text-gray-900 dark:text-white
                  bg-white dark:bg-darkSurface
                  border-2 border-gray-300 dark:border-darkBorderLight
                  rounded-lg focus:border-blue-500 focus:dark:border-darkBlurple focus:outline-none"
                            />
                        ))}
                    </div>

                    {error && <p className="text-red-500 text-center font-semibold">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading || code.some((d) => !d)}
                        className={`${getButtonClass({
                            bg: "bg-primary dark:bg-darkBlurple",
                            hoverBg: "hover:bg-white dark:hover:bg-darkBlurpleHover",
                            text: "text-white dark:text-white",
                            hoverText: "hover:text-gray-900 dark:hover:text-white",
                            focusRing: "focus:ring-4 focus:ring-gray-200 dark:focus:ring-darkTextSecondary/30",
                            disabled: isLoading || code.some((d) => !d),
                        })} mt-4 w-full text-sm sm:px-5 sm:py-3 px-4 py-2 font-medium border border-gray-300 dark:border-darkBorderLight rounded-lg focus:outline-none`}
                    >
                        {isLoading ? "Verifying..." : "Verify Email Change"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmailChangeVerification;

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resendVerificationEmail, verifyEmail } from "../../../api/auth/auth-api";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../hooks/auth/useAuth";
import { Button } from "../../../components/ui/Button";

const EmailVerification: React.FC = () => {
    const { user } = useAuth();
    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
    const inputRefs = useRef<HTMLInputElement[]>([]);
    const navigate = useNavigate();
    const toast = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [resendCooldown, setResendCooldown] = useState(60); // 1 min
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleResendEmail = async () => {
        if (!user?.email) {
            toast.error("Login required to resend email.");
            return;
        }
        setIsResending(true);
        try {
            await resendVerificationEmail(user.email);
            toast.success("Email resent.");
            setResendCooldown(300);
        } catch (err: any) {
            toast.error(err.message || "Could not resend email.");
        } finally {
            setIsResending(false);
        }
    };

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
        e.preventDefault(); // prevent default paste behavior

        const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pastedText.length === 0) return;

        const newCode = Array(6).fill("").map((_, i) => pastedText[i] || "");
        setCode(newCode);

        // Focus the next empty field (or last one)
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
        const verificationCode = code.join("");
        setIsLoading(true);
        setError(null);
        try {
            await verifyEmail(verificationCode);
            toast.success("Email verified successfully!");
            navigate("/login");
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
                    Enter Verification Code
                </h2>

                <p className="text-center text-gray-600 dark:text-darkTextSecondary mb-4">
                    Check your email for a 6-digit code.
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

                    {error && (
                        <p className="text-red-500 font-semibold mt-2 text-center">{error}</p>
                    )}

                    <Button isLoading={isLoading} loadingText="Verifying..." fullWidth={true}
                        disabled={code.some((d) => !d)}
                        size="lg"
                    >
                        Verify Email
                    </Button>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={handleResendEmail}
                        disabled={resendCooldown > 0 || isResending}
                        className="text-sm text-primary dark:text-darkTextSecondary underline disabled:text-gray-400d"
                    >
                        {resendCooldown > 0
                            ? `Resend in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, "0")}`
                            : isResending
                                ? "Resending..."
                                : "Resend Verification Email"}
                    </button>
                </div>
            </div>
        </div>

    );
};

export default EmailVerification;

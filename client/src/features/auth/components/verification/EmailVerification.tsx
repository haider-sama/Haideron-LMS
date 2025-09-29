import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resendVerificationEmail, verifyEmail } from "../../services/auth-api";
import { useToast } from "../../../../shared/context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../../../components/ui/Button";
import { GLOBAL_TITLE } from "../../../../shared/constants";

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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-4xl w-full flex bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300">

                {/* Info Panel */}
                <div className="hidden md:flex w-1/3 flex-col justify-center p-8 bg-gray-50 space-y-6 border-r border-gray-200">
                    <span
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                        className="drop-shadow-sm text-primary text-3xl font-bold"
                    >
                        {GLOBAL_TITLE}
                    </span>
                    {user && (
                        <h3 className="text-xl font-semibold text-gray-800">Hi, {user.firstName ?? "User"}</h3>
                    )}
                    <p className="text-sm text-gray-600">
                        Check your email for a 6-digit verification code to confirm your identity.
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full md:w-2/3 p-8">
                    <div className="space-y-4">

                        {/* Heading */}
                        <h2 className="text-xl font-bold text-primary text-center md:text-left">
                            Enter Verification Code
                        </h2>

                        {/* Optional Description for small screens */}
                        <p className="text-gray-600 text-center md:text-left">
                            Check your email for a 6-digit code.
                        </p>

                        {/* Code Input Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-center gap-2 md:justify-start">
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
                                        text-gray-900 bg-white
                                        border-2 border-gray-300
                                        rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                ))}
                            </div>

                            {error && (
                                <p className="text-red-500 font-semibold mt-2 text-center md:text-left">{error}</p>
                            )}

                            {/* Buttons in one line */}
                            <div className="flex justify-between items-center">
                                {/* Resend */}
                                <button
                                    onClick={handleResendEmail}
                                    disabled={resendCooldown > 0 || isResending}
                                    className="text-sm text-primary underline disabled:text-gray-400"
                                >
                                    {resendCooldown > 0
                                        ? `Resend in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, "0")}`
                                        : isResending
                                            ? "Resending..."
                                            : "Resend Verification Email"}
                                </button>

                                {/* Verify */}
                                <Button
                                    isLoading={isLoading}
                                    loadingText="Verifying..."
                                    size="md"
                                    variant="yellow"
                                    fullWidth={false}
                                    disabled={code.some((d) => !d)}
                                >
                                    Verify Email
                                </Button>
                            </div>
                        </form>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmailVerification;

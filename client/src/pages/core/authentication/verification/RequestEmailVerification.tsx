// RequestEmailPage.tsx
import { useNavigate } from "react-router-dom";
import { resendVerificationEmail } from "../../../../api/auth/auth-api";
import { useState } from "react";
import { getButtonClass } from "../../../../components/ui/ButtonClass";
import { useToast } from "../../../../context/ToastContext";
import { useAuth } from "../../../../hooks/auth/useAuth";

const RequestEmailVerification: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSending, setIsSending] = useState(false);
    const toast = useToast();

    const handleRequest = async () => {
        if (!user || !user.email) {
            toast.error("Login required to request email verification.");
            return;
        }

        setIsSending(true);
        try {
            await resendVerificationEmail(user.email);
            toast.success("Verification email sent.");
            navigate("/verify-email");
        } catch (error: any) {
            toast.error(error.message || "Failed to send verification email.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="max-w-md w-full">
                <h2 className="text-3xl font-bold mb-4 text-center text-primary dark:text-darkTextPrimary">Get Verified</h2>
                <p className="text-center text-gray-600 mb-6 dark:text-darkTextSecondary">
                    Verification unlocks your full experience. <br /> Let’s get your account ready.
                </p>
                <button
                    onClick={handleRequest}
                    disabled={isSending}
                    className={getButtonClass({
                        bg: "bg-yellow-500",
                        hoverBg: "hover:bg-white",
                        text: "text-white",
                        hoverText: "hover:text-gray-900",
                        focusRing: "focus:ring-4 focus:ring-yellow-200",
                        disabled: isSending,
                        extra: "w-full text-sm px-5 py-2 transition-all duration-200 font-medium rounded border border-gray-200 dark:border-darkBorderLight",
                    })}
                >
                    {isSending ? "Sending..." : "Send Verification Email"}
                </button>
            </div>
        </div>

    );
};

export default RequestEmailVerification;

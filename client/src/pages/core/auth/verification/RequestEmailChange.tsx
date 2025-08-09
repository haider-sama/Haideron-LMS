import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestEmailChange } from "../../../../api/auth/auth-api";
import { useToast } from "../../../../context/ToastContext";
import { getButtonClass } from "../../../../components/ui/ButtonClass";
import { useAuth } from "../../../../hooks/auth/useAuth";

const RequestEmailChange: React.FC = () => {
    const { user } = useAuth();
    const [newEmail, setNewEmail] = useState("");
    const [isSending, setIsSending] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleRequestChange = async () => {
        if (!newEmail.trim()) {
            toast.error("Please enter your new email.");
            return;
        }

        if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
            toast.error("You entered the same email. Please enter a different one.");
            return;
        }

        setIsSending(true);
        try {
            await requestEmailChange(newEmail);
            toast.success(`Verification code sent to ${newEmail}`);
            navigate("/verify-email-change");
        } catch (error: any) {
            toast.error(error.message || "Failed to send verification code.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="max-w-md w-full">
                <h2 className="text-3xl font-bold mb-4 text-center text-primary dark:text-darkTextPrimary">
                    Change Your Email
                </h2>
                <p className="text-center text-gray-600 mb-6 dark:text-darkTextSecondary">
                    Your current email: <strong>{user?.email}</strong>
                    <br />
                    Enter a new email to start the verification process.
                </p>
                <input
                    type="email"
                    className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-darkSurface dark:text-white dark:border-darkBorderLight"
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                />
                <button
                    onClick={handleRequestChange}
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
                    {isSending ? "Sending..." : "Send Verification Code"}
                </button>
            </div>
        </div>
    );
};

export default RequestEmailChange;

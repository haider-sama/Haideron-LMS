import { useNavigate } from "react-router-dom";
import { resendVerificationEmail } from "../../../api/auth/auth-api";
import { useState } from "react";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../hooks/auth/useAuth";
import { Button } from "../../../components/ui/Button";

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
                <Button isLoading={isSending} loadingText="Sending..." fullWidth={true}  
                    onClick={handleRequest}
                    size="md" variant="yellow"
                >
                    Send Verification Email
                </Button>
            </div>
        </div>

    );
};

export default RequestEmailVerification;

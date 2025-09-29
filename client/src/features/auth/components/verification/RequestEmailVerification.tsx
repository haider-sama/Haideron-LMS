import { Link, useNavigate } from "react-router-dom";
import { resendVerificationEmail } from "../../services/auth-api";
import { useState } from "react";
import { useToast } from "../../../../shared/context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../../../components/ui/Button";
import { FiArrowLeft } from "react-icons/fi";
import { GLOBAL_TITLE } from "../../../../shared/constants";

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
                        Verification unlocks your full experience. <br />
                        Let’s get your account ready.
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full md:w-2/3 p-8">
                    <div className="space-y-6">

                        {/* Optional Description for small screens */}
                        <p className="text-gray-600 text-center md:text-left">
                            Verification unlocks your full experience. <br />
                            Let’s get your account ready.
                        </p>

                        <div className="flex justify-between items-center mt-4">
                            <Link
                                to="/"
                                className="text-sm text-gray-600 hover:underline flex items-center"
                            >
                                <FiArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                            </Link>

                            <Button
                                isLoading={isSending}
                                loadingText="Sending..."
                                size="md"
                                fullWidth={false}
                                onClick={handleRequest}
                                variant="yellow"
                            >
                                Send Verification Email
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </div>


    );
};

export default RequestEmailVerification;

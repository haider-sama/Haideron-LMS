import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../../shared/context/ToastContext";
import { disable2FA } from "../../services/auth-api";
import { Button } from "../../../../components/ui/Button";
import { GLOBAL_TITLE } from "../../../../shared/constants";
import { useAuth } from "../../hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const Disable2FA: React.FC = () => {
    const [step, setStep] = useState<"password" | "verify">("password");
    const [password, setPassword] = useState("");
    const [twoFAToken, setTwoFAToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    const handlePasswordSubmit = () => {
        if (!password.trim()) {
            toast.error("Password is required.");
            return;
        }
        setStep("verify"); // proceed to 2FA verification step
    };

    const handleDisable = async () => {
        if (!twoFAToken.trim()) {
            toast.error("2FA code is required.");
            return;
        }

        setIsLoading(true);
        try {
            const data = await disable2FA(password, twoFAToken); // will throw on error
            toast.success(data.message); // only reached on success
            navigate("/");
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
        } catch (err: any) {
            const errors = err?.response?.data?.errors as Record<string, string[]> | undefined;

            if (errors) {
                // loop over all fields and show all error messages
                Object.values(errors).forEach((fieldErrors) => {
                    fieldErrors.forEach((msg) => toast.error(msg));
                });
                return;
            }

            toast.error(err?.response?.data?.message || "Failed to disable 2FA.");
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
                        Enter your account password and the 2FA code from your authenticator app to disable Two-Factor Authentication.
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full md:w-2/3 p-8">
                    <div className="space-y-6">

                        {/* Heading */}
                        <h2 className="text-xl font-bold text-primary text-center md:text-left">
                            Disable Two-Factor Authentication
                        </h2>

                        {step === "password" && (
                            <div className="space-y-4">
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handlePasswordSubmit}
                                        isLoading={isLoading}
                                        loadingText="Submitting..."
                                        size="md"
                                        fullWidth={false}
                                        variant="red"
                                        disabled={!password}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "verify" && (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit 2FA code"
                                    value={twoFAToken}
                                    onChange={(e) => setTwoFAToken(e.target.value)}
                                    className="w-full px-4 py-2 mb-4 border rounded-md text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleDisable}
                                        isLoading={isLoading}
                                        loadingText="Disabling..."
                                        size="md"
                                        fullWidth={false}
                                        variant="red"
                                        disabled={!twoFAToken}
                                    >
                                        Disable 2FA
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Disable2FA;

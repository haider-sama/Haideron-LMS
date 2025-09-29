import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../../shared/context/ToastContext";
import { setup2FA, verify2FA } from "../../services/auth-api";
import { Button } from "../../../../components/ui/Button";
import { GLOBAL_TITLE } from "../../../../shared/constants";
import { useAuth } from "../../hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const Enable2FA: React.FC = () => {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<"init" | "verify">("init");
    const toast = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const handleSetup = async () => {
        setIsLoading(true);
        try {
            const data = await setup2FA();
            setQrCode(data.qrCodeDataURL);
            setSecret(data.secret);
            setStep("verify");
            toast.neutral("Scan the QR code with your authenticator app.");
        } catch (error: any) {
            toast.error(error.message || "Failed to setup 2FA.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!otp.trim()) {
            toast.error("Please enter the 2FA code from your authenticator app.");
            return;
        }

        setIsLoading(true);
        try {
            await verify2FA(otp);
            toast.success("2FA has been enabled successfully!");
            navigate("/"); // redirect after success
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

            toast.error(err?.response?.data?.message || "Invalid 2FA code. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadSecret = () => {
        if (!secret) return;
        const blob = new Blob([secret], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "2FA-secret.txt";
        link.click();
        URL.revokeObjectURL(link.href);
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
                        Protect your account with an extra layer of security. Scan the QR code in your authenticator app and enter the code to enable 2FA.
                    </p>

                </div>

                {/* Form Card */}
                <div className="w-full md:w-2/3 p-8">
                    <div className="space-y-6">

                        {/* Heading */}
                        <h2 className="text-xl font-bold text-primary text-center md:text-left">
                            Enable Two-Factor Authentication
                        </h2>

                        {step === "init" && (
                            <div className="space-y-4 text-center md:text-left">
                                <p className="text-gray-600">
                                    You’ll scan a QR code and enter the code from your authenticator app.
                                </p>
                                <Button
                                    onClick={handleSetup}
                                    isLoading={isLoading}
                                    size="md"
                                    fullWidth={false}
                                    variant="yellow"
                                >
                                    Enable 2FA
                                </Button>
                            </div>
                        )}

                        {step === "verify" && (
                            <div className="space-y-4 text-center md:text-left">
                                {qrCode && (
                                    <div className="flex justify-center md:justify-start mb-4">
                                        <img src={qrCode} alt="2FA QR Code" className="border p-2 rounded-md" />
                                    </div>
                                )}
                                {secret && (
                                    <>
                                        <p className="mb-2 text-gray-600">
                                            Secret (backup): <code>{secret}</code>
                                        </p>
                                        <p className="mb-4 text-sm text-gray-500">
                                            Copy this code and save it somewhere safe. You can also download it as a text file.
                                        </p>
                                        <Button
                                            onClick={handleDownloadSecret}
                                            size="sm"
                                            variant="gray"
                                            fullWidth={false}
                                        >
                                            Download Secret
                                        </Button>
                                    </>
                                )}

                                {/* OTP input */}
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center tracking-widest"
                                />

                                {/* Buttons in one line */}
                                <div className="flex justify-end items-center">
                                    {/* TODO: Resend OTP (if applicable) */}

                                    <Button
                                        onClick={handleVerify}
                                        isLoading={isLoading}
                                        loadingText="Verifying..."
                                        size="md"
                                        fullWidth={false}
                                        variant="yellow"
                                        disabled={!otp}
                                    >
                                        Verify & Enable 2FA
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

export default Enable2FA;

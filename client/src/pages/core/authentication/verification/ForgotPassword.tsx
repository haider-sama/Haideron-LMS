import { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import { forgotPassword, resendPasswordResetEmail } from "../../../../api/auth/auth-api";
import { getButtonClass } from "../../../../components/ui/ButtonClass";
import { useToast } from "../../../../context/ToastContext";


const ForgotPassword = () => {
	const [email, setEmail] = useState<string>("");
	const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [resendCooldown, setResendCooldown] = useState(60); // 1 min
	const [isResending, setIsResending] = useState(false);
	const toast = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await forgotPassword(email);
			setIsSubmitted(true);
		} catch (err: any) {
			toast.error(err.message || "Error sending reset link");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (resendCooldown <= 0) return;
		const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
		return () => clearInterval(timer);
	}, [resendCooldown]);

	const handleResendPassword = async () => {
		setIsResending(true);
		try {
			await resendPasswordResetEmail(email);
			toast.success("Password Reset Email resent.");
			setResendCooldown(300);
		} catch (err: any) {
			toast.error(err.message || "Could not resend email.");
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-white dark:bg-darkPrimary">
			<div className="max-w-md w-full overflow-hidden">
				<div className="p-8">
					<h2 className="text-3xl font-bold mb-6 text-center text-primary dark:text-darkTextPrimary bg-clip-text">
						Forgot Password
					</h2>

					{!isSubmitted ? (
						<form onSubmit={handleSubmit}>
							<p className="text-gray-600 dark:text-darkTextMuted mb-6 text-center">
								Enter your email address to confirm it's really you and we'll
								send you a link to reset your password.
							</p>
							<div className="mb-4">
								<div className="relative">
									<span className="absolute inset-y-0 left-0 pl-3 flex items-center">
										<FiMail className="h-5 w-5 text-gray-600 dark:text-darkTextMuted" />
									</span>
									<input
										type="email"
										placeholder="Email Address"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="border border-gray-300 dark:border-darkBorderLight bg-white dark:bg-darkSurface text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-darkTextMuted rounded w-full py-2 px-12 font-normal outline-none focus:ring-2 focus:ring-primary dark:focus:ring-darkBlurple"
									/>
								</div>
							</div>
							<button
								type="submit"
								disabled={isLoading}
								className={`${getButtonClass({
									bg: "bg-primary dark:bg-darkBlurple",
									hoverBg: "hover:bg-white dark:hover:bg-darkBlurpleHover",
									text: "text-white dark:text-white",
									hoverText: "hover:text-gray-900 dark:hover:text-white",
									focusRing: "focus:ring-4 focus:ring-gray-200 dark:focus:ring-darkTextSecondary/30",
									disabled: isLoading,
								})} mt-4 w-full text-sm sm:px-5 sm:py-3 px-4 py-2 font-medium border border-gray-300 dark:border-darkBorderLight rounded-lg focus:outline-none`}
							>
								{isLoading ? "Sending..." : "Send Reset Link"}
							</button>
						</form>
					) : (
						<div className="text-center">
							<div className="w-16 h-16 bg-primary dark:bg-darkBlurple rounded-full flex items-center justify-center mx-auto mb-4">
								<FiMail className="h-8 w-8 text-white" />
							</div>
							<p className="text-gray-600 dark:text-darkTextMuted mb-6">
								If an account exists for <span className="font-medium">{email}</span>, you will receive a password reset link shortly.
							</p>
						</div>
					)}
				</div>

				<div className="px-8 py-4 bg-gray-900 dark:bg-darkSidebar bg-opacity-50 dark:bg-opacity-80 flex justify-center">
					<Link
						to="/login"
						className="text-sm text-white hover:underline flex items-center"
					>
						<FiArrowLeft className="h-4 w-4 mr-2" /> Back to Login
					</Link>
				</div>

				<div className="text-center mt-4">
					<button
						onClick={handleResendPassword}
						disabled={resendCooldown > 0 || isResending}
						className="text-sm text-primary dark:text-darkTextSecondary underline disabled:text-gray-400 dark:disabled:text-darkMuted"
					>
						{resendCooldown > 0
							? `Resend in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, "0")}`
							: isResending
								? "Resending..."
								: "Resend Reset Link"}
					</button>
				</div>
			</div>
		</div>

	);
};

export default ForgotPassword;

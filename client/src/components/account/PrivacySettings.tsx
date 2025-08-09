import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../context/ToastContext";
import { setTheme } from "../../store/themeSlice";
import { RootState } from "../../store/authStore";
import { Link } from "react-router-dom";
import { ALLOW_EMAIL_MIGRATION } from "../../constants";
import { Button } from "../ui/Button";

type PrivacySettingsProps = {
    onClose?: () => void; // Optional prop
};

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ onClose }) => {
    const dispatch = useDispatch();
    const toast = useToast();
    const theme = useSelector((state: RootState) => state.theme.mode);

    const handleThemeToggle = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTheme = e.target.value as "light" | "dark";
        if (newTheme !== theme) {
            dispatch(setTheme(newTheme));
            toast.success(`Switched to ${newTheme === "dark" ? "Dark" : "Light"} Mode`);
        }
    };

    return (
        <div className="space-y-6 bg-white dark:bg-darkSurface p-6 rounded-xl">
            <div>
                <h2 className="text-2xl font-bold text-primary dark:text-darkTextPrimary mb-2">
                    Privacy Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-darkTextSecondary">
                    Control your display preferences and appearance settings.
                </p>
            </div>

            {/* Theme Setting */}
            <div className="bg-gray-50 dark:bg-darkMuted border border-gray-200 dark:border-darkBorderLight rounded-xl p-6 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-md font-semibold text-gray-800 dark:text-darkTextPrimary">
                        Theme
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-darkTextSecondary">
                        Toggle between light and dark themes.
                    </p>
                </div>

                <select
                    id="theme"
                    value={theme}
                    onChange={handleThemeToggle}
                    className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-darkBorderLight bg-white dark:bg-darkSurface text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                </select>
            </div>

            {/* Migrate Email Setting */}
            <div className="bg-gray-50 dark:bg-darkMuted border border-gray-200 dark:border-darkBorderLight rounded-xl p-6 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-md font-semibold text-gray-800 dark:text-darkTextPrimary">
                        Migrate to Personal Email
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-darkTextSecondary">
                        Switch from your institutional email to a personal one.
                    </p>
                </div>

                {ALLOW_EMAIL_MIGRATION ? (
                    <Link to="/request-email-change" onClick={onClose}>
                        <Button size='md' fullWidth={false} variant="blue">
                            Migrate Email Now
                        </Button>
                    </Link>
                ) : (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-200 text-gray-600 dark:bg-darkBorderLight dark:text-darkTextSecondary border border-gray-300 dark:border-darkBorder">
                        Available after graduation
                    </span>
                )}
            </div>
        </div>
    );
};

export default PrivacySettings;

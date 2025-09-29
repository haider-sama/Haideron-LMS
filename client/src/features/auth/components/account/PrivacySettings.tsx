import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../../../shared/context/ToastContext";
import { setTheme } from "../../../../app/store/themeSlice";
import { RootState } from "../../../../app/store/authStore";

type PrivacySettingsProps = {
    onClose?: () => void; // Optional prop
};

const PrivacySettings: React.FC<PrivacySettingsProps> = () => {
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
        <div className="space-y-6 bg-white rounded-xl">
            <div>
                <h2 className="text-2xl font-bold text-primary mb-2">
                    Privacy Settings
                </h2>
                <p className="text-sm text-gray-600">
                    Control your display preferences and appearance settings.
                </p>
            </div>

            {/* Theme Setting */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-md font-semibold text-gray-800">
                        Theme
                    </h3>
                    <p className="text-sm text-gray-600">
                        Toggle between light and dark themes.
                    </p>
                </div>

                <select
                    id="theme"
                    value={theme}
                    onChange={handleThemeToggle}
                    className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                </select>
            </div>
        </div>
    );
};

export default PrivacySettings;

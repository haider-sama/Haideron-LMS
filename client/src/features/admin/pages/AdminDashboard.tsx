import { Helmet } from "react-helmet-async";
import TabbedInterface, { Tab } from "../../../shared/components/TabbedInterface";
import AdminSettingsPanel from "../components/AdminSettingsPanel";
import AuditLogPage from "../components/AuditLogPage";
import UserManagementTable from "../components/UserManagementTable";
import UserRegistration from "../components/UserRegistration";

const AdminDashboard = () => {
    const tabs: Tab[] = [
        { label: "User Registration", content: <UserRegistration /> },
        { label: "User Management", content: <UserManagementTable /> },
        { label: "Audit Logs", content: <AuditLogPage /> },
        { label: "Settings", content: <AdminSettingsPanel /> },
    ];

    return (
        <>
            <Helmet>
                <title>Admin Dashboard</title>
            </Helmet>
            <TabbedInterface
                title="Admin Dashboard"
                subtitle="Monitor, manage, and configure everything in one place."
                tabs={tabs}
                initialIndex={0}
            />
        </>
    );
};

export default AdminDashboard;

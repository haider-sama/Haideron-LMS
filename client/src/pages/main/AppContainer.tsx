import { Outlet } from "react-router-dom";
import Sidebar from "../../components/pages/core/main/sidebar/Sidebar";

export const AppContainer = () => {
  return (
    <div className="h-screen flex overflow-hidden">

      <div className="min-h-screen flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto dark:bg-darkSurface dark:text-darkTextPrimary">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppContainer;

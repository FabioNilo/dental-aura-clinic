import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="min-h-screen xl:ml-72">
        <AdminTopbar />
        <div className="mx-auto flex min-h-screen w-full max-w-[1720px] flex-col px-4 pb-8 pt-4 sm:px-6 sm:pb-10 lg:px-8 xl:px-10 xl:pb-12 xl:pt-6 2xl:px-12">
          <div className="flex-1 pt-4 xl:pt-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

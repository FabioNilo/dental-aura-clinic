import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { MessageCircle } from "lucide-react";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="ml-64 min-h-screen">
        <AdminTopbar />
        <div className="pt-24 px-10 pb-12">
          <Outlet />
        </div>
      </main>
      <button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50">
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};

export default AdminLayout;

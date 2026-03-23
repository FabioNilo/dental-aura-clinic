import { Search, HelpCircle, Bell } from "lucide-react";

const AdminTopbar = () => {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 glass-panel border-b border-border/50 shadow-sm flex justify-between items-center h-16 px-8">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-muted rounded-full pl-10 pr-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary/20 focus:outline-none"
            placeholder="Pesquisar pacientes, médicos..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-primary transition-opacity opacity-80 hover:opacity-100">
            <HelpCircle className="h-5 w-5" />
          </button>
          <button className="text-muted-foreground hover:text-primary transition-opacity opacity-80 hover:opacity-100 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full border-2 border-card" />
          </button>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-foreground leading-tight">Dr. Ricardo Silva</p>
            <p className="text-[10px] text-muted-foreground font-medium">Administrador</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            RS
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;

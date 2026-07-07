import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Gauge, ArrowUpDown, Layers, CreditCard, Landmark,
  Upload, Repeat, Target, Clock, BarChart2, GitBranch, LineChart,
  FlaskConical, Calendar, Bell, LogOut, Heart, Menu, X,
} from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useAlerts } from "../../hooks/useAlerts";

const navGroups = [
  {
    label: "Visão Geral",
    items: [
      { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
      { to: "/executive",  icon: Gauge,            label: "Dashboard Executivo" },
      { to: "/timeline",   icon: Clock,            label: "Linha do Tempo" },
    ],
  },
  {
    label: "Lançamentos",
    items: [
      { to: "/transactions",   icon: ArrowUpDown, label: "Lançamentos" },
      { to: "/installments",   icon: Layers,      label: "Parcelas" },
      { to: "/credit-cards",   icon: CreditCard,  label: "Cartões" },
      { to: "/bank-accounts",  icon: Landmark,    label: "Contas" },
      { to: "/bank-import",    icon: Upload,      label: "Importar Extrato" },
      { to: "/recurring",      icon: Repeat,      label: "Contas Fixas" },
      { to: "/goals",          icon: Target,      label: "Objetivos" },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { to: "/annual",     icon: BarChart2,    label: "Anual" },
      { to: "/cashflow",   icon: GitBranch,    label: "Fluxo de Caixa" },
      { to: "/projection", icon: LineChart,    label: "Projeção" },
      { to: "/simulator",  icon: FlaskConical, label: "Simulador" },
      { to: "/calendar",   icon: Calendar,     label: "Calendário" },
      { to: "/alerts",     icon: Bell,         label: "Alertas" },
    ],
  },
];

// Mapa de rota → título de página para o header mobile
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":    "Dashboard",
  "/executive":    "Executivo",
  "/timeline":     "Linha do Tempo",
  "/transactions": "Lançamentos",
  "/installments": "Parcelas",
  "/credit-cards": "Cartões",
  "/bank-accounts":"Contas",
  "/bank-import":  "Importar",
  "/recurring":    "Contas Fixas",
  "/goals":        "Objetivos",
  "/annual":       "Anual",
  "/cashflow":     "Fluxo de Caixa",
  "/projection":   "Projeção",
  "/simulator":    "Simulador",
  "/calendar":     "Calendário",
  "/alerts":       "Alertas",
};

function NavContent({
  onItemClick,
  currentUser,
  handleLogout,
  unreadCount,
}: {
  onItemClick?: () => void;
  currentUser: { name: string } | null;
  handleLogout: () => void;
  unreadCount: number;
}) {
  return (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-none">Finanças</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">do Casal</p>
          </div>
        </div>
      </div>

      {/* Usuário */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">
          Logado como
        </p>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-brand-700">
              {currentUser?.name.charAt(0)}
            </span>
          </div>
          <span className="text-sm font-semibold text-slate-700">{currentUser?.name}</span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-2.5 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={[
                          "w-4 h-4 flex-shrink-0",
                          isActive ? "text-brand-600" : "text-slate-400",
                        ].join(" ")}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.to === "/alerts" && unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sair */}
      <div className="p-2 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors min-h-[44px]"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          Trocar usuário
        </button>
      </div>
    </>
  );
}

export function AppLayout() {
  const { currentUser, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: alertData } = useAlerts();
  const unreadCount = alertData?.unreadCount ?? 0;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fecha drawer quando a rota muda
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Fecha drawer com Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Bloqueia scroll do body quando drawer aberto
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  const pageTitle = PAGE_TITLES[location.pathname] ?? "Finanças do Casal";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ============================================================
          SIDEBAR — visível apenas em md+ (desktop)
      ============================================================ */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-white border-r border-slate-200 flex-col">
        <NavContent
          currentUser={currentUser}
          handleLogout={handleLogout}
          unreadCount={unreadCount}
        />
      </aside>

      {/* ============================================================
          DRAWER — visível apenas em mobile (< md)
      ============================================================ */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        >
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-2xl",
          "transition-transform duration-300 ease-in-out md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Menu lateral"
      >
        {/* Botão fechar no topo do drawer */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <NavContent
          onItemClick={() => setDrawerOpen(false)}
          currentUser={currentUser}
          handleLogout={handleLogout}
          unreadCount={unreadCount}
        />
      </aside>

      {/* ============================================================
          ÁREA PRINCIPAL
      ============================================================ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header mobile — apenas em < md */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 z-30">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm truncate max-w-[160px]">
              {pageTitle}
            </span>
          </div>

          <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-brand-700">
              {currentUser?.name.charAt(0)}
            </span>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

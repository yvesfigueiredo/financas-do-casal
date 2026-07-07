import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
  label?: string;
}

// Botão de ação flutuante — visível apenas em mobile (< sm).
// Em desktop, a ação equivalente já existe no PageHeader.
export function FAB({ onClick, label = "Novo lançamento" }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={[
        "sm:hidden fixed bottom-5 right-5 z-30",
        "w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg",
        "flex items-center justify-center",
        "active:scale-95 transition-transform",
        "hover:bg-brand-700",
      ].join(" ")}
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}

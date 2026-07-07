import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import { useAuthStore } from "../stores/auth.store";
import { User } from "../types";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, currentUser } = useAuthStore();
  const { data: users, isLoading, error } = useUsers();

  // Se já tem usuário logado, redireciona
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleSelectUser = (user: User) => {
    setUser(user);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-lg mb-4">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Finanças do Casal
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Controle financeiro a dois
          </p>
        </div>

        {/* Card de seleção */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider text-center mb-6">
            Quem está acessando?
          </p>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              Não foi possível conectar ao servidor. Verifique se o backend está
              rodando.
            </div>
          )}

          {users && (
            <div className="space-y-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full group flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-brand-400 hover:bg-brand-50 transition-all duration-150"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <span className="text-xl font-bold text-white">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-slate-800 group-hover:text-brand-700">
                      Entrar como {user.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Ver meus lançamentos e resumo
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Finanças do Casal &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

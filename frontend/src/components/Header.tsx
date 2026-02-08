import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm">
      <Link to="/" className="text-sm font-semibold text-white hover:text-blue-100 border border-white rounded-md px-3 py-1">
        Home
      </Link>
      <button
        onClick={logout}
        className="text-sm text-white hover:text-purple-100 border border-white rounded-md px-3 py-1"
      >
        Log out
      </button>
    </header>
  );
}

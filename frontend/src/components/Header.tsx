import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/shared/Button";

export function Header() {
  const { logout, merchantName } = useAuth();

  return (
    <header className="flex flex-row items-center justify-between px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 shadow-sm">
      <div className="flex flex-row items-center gap-4">
        <span className="text-sm font-semibold text-white">{merchantName}</span>
        <Button to="/">Home</Button>
        <Button to="/events">Events</Button>
        <Button to="/api-keys">API Keys</Button>
        <Button to="/skus">SKUs</Button>
      </div>
      <Button onClick={logout}>Log out</Button>
    </header>
  );
}

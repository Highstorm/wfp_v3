import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Utensils } from "lucide-react";
import { auth } from "../../lib/firebase";
import { useAuthStore } from "../../stores/auth.store";

export const LoginForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const { email, password, setEmail, setPassword, resetForm } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      resetForm();
      navigate("/day-planning");
    } catch (err: any) {
      switch (err.code) {
        case "auth/invalid-credential":
          setError("E-Mail oder Passwort ist falsch.");
          break;
        default:
          setError(
            "Ein Fehler ist aufgetreten. Bitte versuche es später erneut."
          );
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8" />
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">
            Weekly Food Planner
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Willkommen zurück
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive-foreground text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="E-Mail"
              autoComplete="email"
            />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Passwort"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Anmelden
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Noch kein Account?{" "}
          <Link to="/register" className="font-medium text-zinc-900 dark:text-white">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
};

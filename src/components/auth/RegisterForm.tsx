import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuthStore } from "../../stores/authStore";

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const { email, password, name, setEmail, setPassword, setName, resetForm } =
    useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Setze den displayName
      await updateProfile(user, {
        displayName: name,
      });

      resetForm();
      navigate("/day-planning");
    } catch (err: any) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Diese E-Mail-Adresse wird bereits verwendet.");
          break;
        case "auth/weak-password":
          setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
          break;
        default:
          setError(
            "Ein Fehler ist aufgetreten. Bitte versuche es später erneut."
          );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Willkommen</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Erstelle deinen Account für Weekly Food Planner
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground">
              <p className="font-medium">Ups! Ein Fehler ist aufgetreten</p>
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Max Mustermann"
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                E-Mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="max@beispiel.de"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Passwort
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            Account erstellen
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Bereits registriert?{" "}
          <Link to="/login" className="font-medium text-primary">
            Hier anmelden
          </Link>
        </p>
      </div>
    </div>
  );
};

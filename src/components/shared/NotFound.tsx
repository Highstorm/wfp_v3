import { Link } from "react-router-dom";

export const NotFound = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="card p-8 text-center">
        <h1 className="text-4xl font-bold text-muted-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-4">Seite nicht gefunden</h2>
        <p className="text-muted-foreground mb-6">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-block"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
};

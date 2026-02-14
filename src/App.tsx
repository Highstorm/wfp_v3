import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { AuthRedirect } from "./components/auth/AuthRedirect";
import { DayPlanningPage } from "./components/meal-planning/DayPlanningPage";
import { Toast } from "./components/shared/Toast";
import { ProtectedLayout } from "./components/layout/ProtectedLayout.tsx";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { NotFound } from "./components/shared/NotFound";
import { LoadingSpinner } from "./components/shared/LoadingSpinner";

const DishesPage = lazy(() =>
  import("./components/dishes/DishesPage").then((m) => ({ default: m.DishesPage }))
);
const DishForm = lazy(() =>
  import("./components/dishes/DishForm").then((m) => ({ default: m.DishForm }))
);
const CreateDishWithIngredients = lazy(() =>
  import("./components/dishes/CreateDishWithIngredients").then((m) => ({
    default: m.CreateDishWithIngredients,
  }))
);
const EditDishWithIngredients = lazy(() =>
  import("./components/dishes/EditDishWithIngredients").then((m) => ({
    default: m.EditDishWithIngredients,
  }))
);
const ImportDishPage = lazy(() =>
  import("./components/dishes/ImportDishPage").then((m) => ({
    default: m.ImportDishPage,
  }))
);
const ProfilePage = lazy(() =>
  import("./components/auth/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const Dashboard = lazy(() =>
  import("./components/layout/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const PorridgeCalculator = lazy(() =>
  import("./components/porridge/PorridgeCalculator").then((m) => ({
    default: m.PorridgeCalculator,
  }))
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Toast />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          <Route
            element={
              <AuthRedirect>
                <ProtectedLayout />
              </AuthRedirect>
            }
          >
            <Route
              index
              element={
                <ErrorBoundary>
                  <DayPlanningPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/day-planning"
              element={
                <ErrorBoundary>
                  <DayPlanningPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/dishes"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <DishesPage />
                </Suspense>
              }
            />
            <Route
              path="/dishes/new"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <DishForm />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/dishes/:id/edit"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <DishForm />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/dishes/create-with-ingredients"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <CreateDishWithIngredients />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/dishes/:id/edit-ingredients"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <EditDishWithIngredients />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/dishes/import"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ImportDishPage />
                </Suspense>
              }
            />
            <Route
              path="/shared-dish/:shareCode"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ImportDishPage />
                </Suspense>
              }
            />
            <Route
              path="/porridge"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <PorridgeCalculator />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProfilePage />
                </Suspense>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

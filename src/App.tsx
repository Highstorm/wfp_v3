import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DishesPage } from "./components/dishes/DishesPage";
import { DishForm } from "./components/dishes/DishForm";
import { CreateDishWithIngredients } from "./components/dishes/CreateDishWithIngredients";
import { EditDishWithIngredients } from "./components/dishes/EditDishWithIngredients";
import { ImportDishPage } from "./components/dishes/ImportDishPage";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { ProfilePage } from "./components/auth/ProfilePage";
import { AuthRedirect } from "./components/auth/AuthRedirect";
import { DayPlanningPage } from "./components/meal-planning/DayPlanningPage";
import { Dashboard } from "./components/layout/Dashboard";
import { PorridgeCalculator } from "./components/porridge/PorridgeCalculator";
import { Toast } from "./components/shared/Toast";
import { ProtectedLayout } from "./components/layout/ProtectedLayout.tsx";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { NotFound } from "./components/shared/NotFound";

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/day-planning"
              element={
                <ErrorBoundary>
                  <DayPlanningPage />
                </ErrorBoundary>
              }
            />
            <Route path="/dishes" element={<DishesPage />} />
            <Route
              path="/dishes/new"
              element={
                <ErrorBoundary>
                  <DishForm />
                </ErrorBoundary>
              }
            />
            <Route
              path="/dishes/:id/edit"
              element={
                <ErrorBoundary>
                  <DishForm />
                </ErrorBoundary>
              }
            />
            <Route
              path="/dishes/create-with-ingredients"
              element={
                <ErrorBoundary>
                  <CreateDishWithIngredients />
                </ErrorBoundary>
              }
            />
            <Route
              path="/dishes/:id/edit-ingredients"
              element={
                <ErrorBoundary>
                  <EditDishWithIngredients />
                </ErrorBoundary>
              }
            />
            <Route path="/dishes/import" element={<ImportDishPage />} />
            <Route
              path="/shared-dish/:shareCode"
              element={<ImportDishPage />}
            />
            <Route
              path="/porridge"
              element={
                <ErrorBoundary>
                  <PorridgeCalculator />
                </ErrorBoundary>
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

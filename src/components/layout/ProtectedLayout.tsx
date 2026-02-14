import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { MobileTabBar } from "./MobileTabBar";

export const ProtectedLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 pb-20 pt-3">
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  );
};

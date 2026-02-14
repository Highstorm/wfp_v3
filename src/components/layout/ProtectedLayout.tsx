import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";

export const ProtectedLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="container flex-1 pb-20 pt-4 md:pb-6">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
};

import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import IdeaDetail from "./pages/IdeaDetail.jsx";
import IdeaForm from "./pages/IdeaForm.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Me from "./pages/Me.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import Protected from "./components/Protected.jsx";
import AdminOnly from "./components/AdminOnly.jsx";
import Sidebar from "./components/Sidebar.jsx";

export default function App() {
  const routeTree = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ideas/:idOrSlug" element={<IdeaDetail />} />

      <Route element={<Protected />}>
        <Route path="/ideas/new" element={<IdeaForm />} />
        <Route path="/me" element={<Me />} />
        <Route element={<AdminOnly />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full px-10 py-10 xl:px-16 2xl:px-20">{routeTree}</div>
      </main>
    </div>
  );
}

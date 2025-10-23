import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
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

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container py-6">
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
      </div>
    </>
  );
}

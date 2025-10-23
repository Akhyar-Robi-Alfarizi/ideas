import { Link } from "react-router-dom";
export default function NotFound(){
  return (
    <div className="text-center space-y-3">
      <h1 className="text-3xl font-bold">404</h1>
      <p>Halaman tidak ditemukan.</p>
      <Link className="btn-primary" to="/">Kembali ke beranda</Link>
    </div>
  );
}

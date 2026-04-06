import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full flex justify-between items-center px-8 py-4 bg-white shadow">
      <h1 className="font-bold text-lg">MyShop</h1>

      <div className="flex gap-4">
        <Link href="/">Home</Link>
        <Link href="/login">Đăng nhập</Link>
        <Link href="/register">Đăng ký</Link>
      </div>
    </nav>
  );
}

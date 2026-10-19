import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg hover:text-gray-200">
        MFCS
      </Link>
      <nav>
        <Link href="/support" className="text-sm font-medium hover:underline text-gray-200">
          Support
        </Link>
      </nav>
    </header>
  );
}

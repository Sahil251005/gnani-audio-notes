"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


const NAV_ITEMS = [
  { label: "Upload", href: "/" },
  { label: "History", href: "/history" },
  { label: "Architecture", href: "/architecture" },
];


export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <Link href="/">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Audio Notes Workspace
            </h1>

            <p className="text-sm text-gray-500">
              Upload, process, and review audio notes
            </p>
          </div>
        </Link>


        <nav className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  active
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
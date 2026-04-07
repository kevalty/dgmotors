import Link from "next/link";
import { Car } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Car className="w-5 h-5 text-primary-foreground" />
        </div>
        <span
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          DG Motors
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

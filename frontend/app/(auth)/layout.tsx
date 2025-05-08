import { AuthProviders } from "@/components/auth-providers";
import { Footer } from "@/components/footer";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Bus } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProviders>
          <div className="flex flex-col min-h-screen">
            <header className="p-4 flex items-center justify-center">
              <Link href="/" className="flex items-center">
                <Bus className="h-8 w-8 text-primary mr-2" />
                <span className="text-xl font-bold">BusTracker</span>
              </Link>
            </header>
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProviders>
      </body>
    </html>
  );
} 
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { login, LoginCredentials } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
    otp: ""
  });
  const [showOtpField, setShowOtpField] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use the login function from auth.ts
      const response = await login({
        email: credentials.email,
        password: credentials.password,
        otp: credentials.otp || undefined
      });

      if (!response.success) {
        // Check if error is due to MFA being required
        if (response.error === "OTP required" && !showOtpField) {
          setShowOtpField(true);
          setError("Please enter the OTP sent to your email");
          setLoading(false);
          return;
        }
        throw new Error(response.error || "Login failed");
      }

      // Check if the user is an admin
      const token = response.token;
      if (token) {
        try {
          // Parse the JWT token to get user role
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            
            // Redirect based on role
            if (payload.role === 'admin') {
              router.push("/admin");
              return;
            }
          }
        } catch (err) {
          console.error("Error parsing token:", err);
          // Continue with normal redirect if token parsing fails
        }
      }

      // Regular login successful, redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">BusTracker Login</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={credentials.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          
          {showOtpField && (
            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                placeholder="123456"
                value={credentials.otp || ""}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
} 
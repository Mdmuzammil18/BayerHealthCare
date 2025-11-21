"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Heart, Activity, Users, Calendar } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.name}!`,
      });

      // Redirect based on role
      if (data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/staff/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Bayer Healthcare</h1>
              <p className="text-sm text-white/80">Shift Management System</p>
            </div>
          </div>

          {/* Main Heading */}
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
              Your Health,<br />Our Priority
            </h2>
            <p className="text-xl text-white/90">
              Streamline healthcare operations with intelligent shift scheduling
            </p>
          </div>

          {/* Featured Health Topics */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">How Admin</h3>
                <p className="text-sm text-white/80">
                  Create shifts, assign staff, and manage your healthcare team efficiently
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Explore Doctors and Nurses</h3>
                <p className="text-sm text-white/80">
                  Track attendance, manage schedules, and optimize staff allocation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Instant Scheduling</h3>
                <p className="text-sm text-white/80">
                  Real-time shift updates with daily, weekly, and staff-wise views
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            © 2025 Bayer Healthcare. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-200/30 to-cyan-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-0 relative z-10 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full flex items-center justify-center mb-2">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Healthcare Shift Scheduler
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to manage shifts and attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@healthcare.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
              <p className="font-semibold mb-2">Demo Login:</p>
              <p className="text-muted-foreground mb-1">
                <strong>Admin:</strong> Use any email with "admin" (e.g., admin@test.com)
              </p>
              <p className="text-muted-foreground">
                <strong>Staff:</strong> Use any other email (e.g., staff@test.com)
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Any password works - this is a demo!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

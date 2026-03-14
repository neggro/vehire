"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase";
import { APP_NAME } from "@/constants";
import { Logo } from "@/components/layout/logo";
import { Loader2, Mail, Shield, Star, Car } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createBrowserClient();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${baseUrl}/api/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setMagicLinkSent(true);
      toast({
        title: "Enlace enviado",
        description: "Revisa tu correo para continuar",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserClient();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/api/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Show success message after magic link is sent
  if (magicLinkSent) {
    return (
      <Card className="w-full max-w-md border-border/40 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-6">
            <Logo size="lg" showText={false} />
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Revisa tu correo</CardTitle>
          <CardDescription className="text-base">
            Hemos enviado un enlace mágico a <strong className="text-foreground">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Haz clic en el enlace del correo para iniciar sesión. El enlace expira en 24 horas.
          </p>
          <Button
            variant="outline"
            className="w-full rounded-xl h-11"
            onClick={() => setMagicLinkSent(false)}
          >
            Usar otro correo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/40 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-6">
          <Logo size="lg" />
        </div>
        <CardTitle className="text-2xl font-display">Bienvenido a {APP_NAME}</CardTitle>
        <CardDescription className="text-base">
          Usa tu correo o Google para continuar
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleMagicLink}>
        <CardContent className="space-y-4 px-8">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
              className="h-11 rounded-xl"
            />
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl shadow-sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Enviar enlace mágico
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col gap-4 px-8 pb-8">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground tracking-wider">
              O continúa con
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          type="button"
          className="w-full h-11 rounded-xl"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Al continuar, aceptas nuestros{" "}
          <Link href="/terms" className="text-primary hover:underline underline-offset-4">
            Términos de servicio
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

function LoginLoading() {
  return (
    <Card className="w-full max-w-md border-border/40 shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Logo size="lg" />
        </div>
        <CardTitle className="text-2xl font-display">Bienvenido a {APP_NAME}</CardTitle>
        <CardDescription>Cargando...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        <div className="relative py-2">
          <div className="h-px w-full bg-muted" />
        </div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-background to-[hsl(var(--gold))]/[0.03]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[hsl(var(--gold))]/[0.06] blur-3xl" />

      <div className="container flex min-h-screen relative">
      {/* Left panel - features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] items-center justify-center p-12 relative">
        <div className="max-w-md space-y-10">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight">
              Tu próximo viaje comienza aquí
            </h2>
            <p className="mt-3 text-muted-foreground text-lg leading-relaxed">
              Accede a cientos de vehículos en todo Uruguay con la confianza de una plataforma segura.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                icon: Car,
                title: "Variedad de vehículos",
                desc: "Desde económicos hasta deportivos de lujo",
              },
              {
                icon: Shield,
                title: "Totalmente asegurado",
                desc: "Seguro incluido en cada reserva",
              },
              {
                icon: Star,
                title: "Comunidad confiable",
                desc: "Conductores y anfitriones verificados",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <Suspense fallback={<LoginLoading />}>
          <LoginForm />
        </Suspense>
      </div>
      </div>
    </div>
  );
}

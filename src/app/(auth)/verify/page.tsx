"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";
import { Car, Mail } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </Link>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
          <CardDescription>
            {email
              ? `Hemos enviado un enlace de confirmación a ${email}`
              : "Te hemos enviado un enlace de confirmación a tu correo"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Haz clic en el enlace del correo para verificar tu cuenta. Si no
            encuentras el correo, revisa tu carpeta de spam.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/login">Volver a iniciar sesión</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Ir al inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

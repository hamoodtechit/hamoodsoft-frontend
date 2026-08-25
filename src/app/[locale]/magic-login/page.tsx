"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, Sparkles, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function MagicLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const rawLocale = params?.locale;
  const locale: string = Array.isArray(rawLocale) ? rawLocale[0] : rawLocale || "en";

  const { setToken, setRefreshToken, setUser, setBusinesses } = useAuthStore();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<"authenticating" | "success" | "error">("authenticating");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const rawKey = searchParams.get("key") || searchParams.get("token") || searchParams.get("magic");

    if (!rawKey) {
      setStatus("error");
      setErrorMessage("No demo access key found in this URL. Please use a valid direct login link.");
      return;
    }

    const key: string = rawKey;
    let isMounted = true;

    async function doMagicLogin() {
      try {
        setStatus("authenticating");
        const response = await authApi.magicLogin({ key });

        if (!isMounted) return;

        // Store tokens and profile
        setToken(response.token);
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken);
        }
        if (response.user) {
          setUser(response.user);
          queryClient.setQueryData(["auth", "profile"], response.user);
        }
        if (response.businesses) {
          setBusinesses(response.businesses);
          queryClient.setQueryData(["businesses"], response.businesses);
        }

        setStatus("success");

        // Smooth redirect to dashboard
        setTimeout(() => {
          router.replace(`/${locale}/dashboard`);
        }, 800);
      } catch (err: any) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to authenticate demo session. The link key may be invalid or demo data has not been seeded."
        );
      }
    }

    doMagicLogin();

    return () => {
      isMounted = false;
    };
  }, [searchParams, locale, router, setToken, setRefreshToken, setUser, setBusinesses, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-md">
        <Card className="border-2 shadow-2xl overflow-hidden backdrop-blur-sm bg-card/95">
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-primary to-blue-500 animate-pulse" />
          
          <CardHeader className="text-center pb-2 pt-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg ring-4 ring-primary/20">
              <Fuel className="h-8 w-8 animate-bounce" />
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight">
              {status === "authenticating" && "Connecting to Demo..."}
              {status === "success" && "Welcome to Demo Station!"}
              {status === "error" && "Demo Access Failed"}
            </CardTitle>

            <CardDescription className="text-sm">
              {status === "authenticating" && "Setting up live petrol pump dashboard & demo meters"}
              {status === "success" && "Session authenticated successfully. Redirecting..."}
              {status === "error" && "We could not automatically sign you in"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4 pb-6">
            {status === "authenticating" && (
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <Sparkles className="h-4 w-4 text-emerald-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-sm font-medium text-foreground">Loading Demo Tenant</p>
                  <p className="text-xs text-muted-foreground">Preparing fuel tanks, dispensers & sample POS...</p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center space-y-3 py-4 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-12 w-12 animate-in zoom-in-50 duration-300" />
                <p className="text-sm font-semibold">Opening Dashboard...</p>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-destructive text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-xs uppercase tracking-wider">Authentication Error</p>
                    <p className="text-xs opacity-90 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button asChild className="w-full">
                    <Link href={`/${locale}/login`}>
                      Go to Standard Login
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MagicLoginContent />
    </Suspense>
  );
}

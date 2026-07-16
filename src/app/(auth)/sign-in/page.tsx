import { ShieldCheck } from "lucide-react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { BrandMark } from "@/components/layout/brand-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getI18n } from "@/lib/i18n/server";
import type { SignInErrorCode } from "@/server/actions/auth";

type SignInPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

function getInitialError(
  error: string | undefined,
): SignInErrorCode | undefined {
  if (error === "callback") return "callbackFailed";
  if (error === "inactive") return "inactiveAccount";
  return undefined;
}

function getSafeNextPath(next: string | undefined): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [{ locale, messages }, params] = await Promise.all([
    getI18n(),
    searchParams,
  ]);

  return (
    <main className="bg-card grid min-h-screen lg:grid-cols-[minmax(22rem,0.82fr)_1.18fr]">
      <section className="bg-sidebar text-sidebar-foreground relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-lg font-semibold text-white">
              {messages.brand.name}
            </p>
            <p className="text-sidebar-foreground/65 text-sm">
              {messages.brand.subtitle}
            </p>
          </div>
        </div>

        <div className="relative max-w-lg pb-8">
          <span className="mb-6 grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/10">
            <ShieldCheck className="size-6" />
          </span>
          <p className="text-sidebar-foreground/70 text-sm font-semibold tracking-[0.16em] uppercase">
            {messages.auth.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-tight text-white xl:text-5xl">
            {messages.metadata.description}
          </h1>
        </div>
      </section>

      <section className="bg-background relative flex min-h-screen items-center justify-center px-5 py-20 sm:px-8">
        <div className="absolute top-4 right-4 flex items-center gap-1 sm:top-6 sm:right-6">
          <LanguageSwitcher locale={locale} messages={messages.language} />
          <ThemeToggle messages={messages.theme} />
        </div>

        <div className="surface-enter w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <BrandMark className="bg-primary text-primary-foreground" />
              <div>
                <p className="font-semibold">{messages.brand.name}</p>
                <p className="text-muted-foreground text-xs">
                  {messages.brand.subtitle}
                </p>
              </div>
            </div>
          </div>

          <p className="text-primary text-sm font-semibold">
            {messages.auth.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {messages.auth.title}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {messages.auth.description}
          </p>

          <div className="mt-8">
            <SignInForm
              messages={messages.auth}
              initialError={getInitialError(params.error)}
              nextPath={getSafeNextPath(params.next)}
            />
          </div>

          {process.env.NODE_ENV === "development" ? (
            <div className="bg-card mt-8 rounded-2xl border p-4 shadow-xs">
              <p className="text-sm font-semibold">{messages.auth.demoTitle}</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {messages.auth.demoDescription}
              </p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted-foreground">
                  {messages.auth.demoEmailLabel}
                </dt>
                <dd className="font-mono">officer@procureflow.local</dd>
                <dt className="text-muted-foreground">
                  {messages.auth.demoPasswordLabel}
                </dt>
                <dd className="font-mono">ProcureFlow123!</dd>
              </dl>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

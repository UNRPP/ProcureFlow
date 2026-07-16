import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { BrandMark } from "@/components/layout/brand-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getI18n } from "@/lib/i18n/server";

export default async function ForgotPasswordPage() {
  const { locale, messages } = await getI18n();

  return (
    <main className="bg-background relative flex min-h-screen items-center justify-center px-5 py-20 sm:px-8">
      <div className="absolute top-4 right-4 flex items-center gap-1 sm:top-6 sm:right-6">
        <LanguageSwitcher locale={locale} messages={messages.language} />
        <ThemeToggle messages={messages.theme} />
      </div>
      <div className="surface-enter w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <BrandMark className="bg-primary text-primary-foreground" />
          <div>
            <p className="font-semibold">{messages.brand.name}</p>
            <p className="text-muted-foreground text-xs">
              {messages.brand.subtitle}
            </p>
          </div>
        </div>
        <p className="text-primary text-sm font-semibold">
          {messages.auth.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {messages.auth.forgotPasswordTitle}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {messages.auth.forgotPasswordDescription}
        </p>
        <div className="mt-8">
          <ForgotPasswordForm messages={messages.auth} />
        </div>
      </div>
    </main>
  );
}

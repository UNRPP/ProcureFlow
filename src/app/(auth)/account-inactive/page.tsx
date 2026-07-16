import { CircleOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { signOut } from "@/server/actions/auth";

export default async function AccountInactivePage() {
  const { messages } = await getI18n();

  return (
    <main className="bg-background grid min-h-screen place-items-center p-6">
      <div className="max-w-md text-center">
        <span className="bg-destructive/10 text-destructive mx-auto grid size-12 place-items-center rounded-2xl">
          <CircleOff />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">
          {messages.auth.errors.inactiveAccount}
        </h1>
        <form action={signOut} className="mt-6">
          <Button type="submit">{messages.header.signOut}</Button>
        </form>
      </div>
    </main>
  );
}

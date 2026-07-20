import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { LoginButton } from "@/components/auth/login-button";
import { PageTransition } from "@/components/marketing/PageTransition";
import { LoginShowcase } from "@/components/marketing/LoginShowcase";
import { GlowAuthCard } from "@/components/marketing/GlowAuthCard";
import styles from "./login.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in"
};

export default async function LoginPage() {
  let user = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();
    user = currentUser;
  } catch {
    user = null;
  }

  if (user) {
    redirect("/dashboard");
  }

  return (
    <PageTransition>
      <section className={styles.page}>
        <div className={styles.panel}>
          <div className="flex flex-col justify-center gap-4">
            <LoginShowcase />
          </div>

          <div className="flex items-center justify-center">
            <GlowAuthCard>
              <EmailAuthForm />
              <div className={styles.divider}>
                <span>or</span>
              </div>
              <LoginButton />
            </GlowAuthCard>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

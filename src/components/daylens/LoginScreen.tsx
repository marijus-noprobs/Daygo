import { useState } from "react";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero-opening.jpg";

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [mode, setMode] = useState<"hero" | "login" | "signup">("hero");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (mode === "hero") {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="relative w-full max-w-[448px] h-full flex flex-col mx-auto">
        {/* Hero image */}
        <div className="flex-1 relative overflow-hidden">
          <img src={heroImg} alt="DayLens" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        {/* Bottom CTA area */}
        <div className="relative z-10 px-6 pb-10 pt-4 -mt-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight mb-2">
              DayLens
            </h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Track your day. Optimize your life.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-col gap-3">
            {/* Google button */}
            <button
              onClick={onLogin}
              className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#1a1a1a",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Apple button */}
            <button
              onClick={onLogin}
              className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </button>

            {/* Email button */}
            <button
              onClick={() => setMode("login")}
              className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Continue with Email
            </button>
          </motion.div>

          <p className="text-[10px] text-muted-foreground/40 text-center mt-6">
            By continuing, you agree to the Terms of Service & Privacy Policy
          </p>
        </div>
        </div>
      </div>
    );
  }

  // Login / Signup form
  const isSignup = mode === "signup";
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="relative w-full max-w-[448px] h-full flex flex-col mx-auto">
      <div className="flex-1 flex flex-col px-6 pt-14 pb-8">
        {/* Back */}
        <button onClick={() => setMode("hero")} className="text-muted-foreground text-sm mb-8 self-start">
          ← Back
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-2xl font-extrabold text-foreground mb-1">
            {isSignup ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {isSignup ? "Start your journey" : "Log in to continue"}
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {isSignup && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-[52px] rounded-2xl px-5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full h-[52px] rounded-2xl px-5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full h-[52px] rounded-2xl px-5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          />

          <button
            onClick={onLogin}
            className="w-full h-[52px] rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] mt-2"
            style={{ background: "rgba(255,255,255,0.95)", color: "#1a1a1a" }}
          >
            {isSignup ? "Create Account" : "Log In"}
          </button>

          {!isSignup && (
            <button className="text-xs text-muted-foreground/50 self-center mt-1">
              Forgot password?
            </button>
          )}
        </div>

        <div className="mt-auto pt-8 text-center">
          <button onClick={() => setMode(isSignup ? "login" : "signup")} className="text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <span className="text-foreground font-semibold">{isSignup ? "Log in" : "Sign up"}</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

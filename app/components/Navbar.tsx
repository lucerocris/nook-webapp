"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type AuthStep = "email" | "login" | "signup";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!authStep) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthStep(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [authStep]);

  const openAuth = (step: AuthStep) => {
    setIsMenuOpen(false);
    setAuthStep(step);
  };

  const closeAuth = () => setAuthStep(null);

  const handleEmailContinue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAuthStep("login");
  };

  const handleLoginContinue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleSignupContinue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out",
        scrolled
          ? "bg-white/95 backdrop-blur border-b border-zinc-200"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        <Link href="/" aria-label="Nook home" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Nook"
            width={1980}
            height={667}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
  
          <Link
            href="https://business.nookph.app/"
            className="rounded-full border border-zinc-300 bg-transparent px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            Claim your Cafe
          </Link>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:bg-zinc-50"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <line x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-zinc-200/70 overflow-hidden"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => openAuth("email")}
                  className="block w-full px-4 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  Log in or sign up
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => openAuth("signup")}
                  className="block w-full px-4 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  Sign up
                </button>
                <Link
                  href="/download-app"
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  Download the app
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {authStep && (
        <div
          className="fixed inset-0 z-[60] flex min-h-dvh items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          onMouseDown={closeAuth}
        >
          <div
            className="relative flex min-h-[425px] w-full max-w-[380px] flex-col rounded-[22px] bg-white px-7 pb-8 pt-12 shadow-2xl sm:max-w-[410px] sm:px-8"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close login dialog"
              onClick={closeAuth}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>

            <Image
              src="/logo.svg"
              alt="Nook"
              width={1980}
              height={667}
              priority
              className="mx-auto mb-3 h-8 w-auto"
            />

            {authStep === "email" && (
              <form onSubmit={handleEmailContinue} className="flex flex-col">
                <h2 id="auth-title" className="text-center text-lg font-semibold text-zinc-950">
                  Log in or sign up
                </h2>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="mt-5 h-11 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
                />
                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="mt-3 h-[43px] rounded-xl bg-[#9eaca4] text-sm font-medium text-white transition-colors enabled:hover:bg-[#365743] disabled:cursor-not-allowed disabled:opacity-90"
                >
                  Continue
                </button>

                <div className="my-6 flex items-center gap-3 px-2 text-xs text-zinc-400">
                  <span className="h-px flex-1 bg-zinc-200" />
                  OR
                  <span className="h-px flex-1 bg-zinc-200" />
                </div>

                <button
                  type="button"
                  className="flex h-[43px] items-center justify-center gap-3 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-50"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </form>
            )}

            {authStep === "login" && (
              <form onSubmit={handleLoginContinue} className="flex flex-col">
                <h2 id="auth-title" className="text-center text-lg font-semibold text-zinc-950">
                  Welcome back!
                </h2>
                <p className="mt-2 text-center text-xs text-zinc-400">
                  Signing in as {email || "lucerocrislawrence@gmail.com"}
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="mt-5 h-11 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
                />
                <button
                  type="submit"
                  disabled={!password}
                  className="mt-3 h-[43px] rounded-xl bg-[#9eaca4] text-sm font-medium text-white transition-colors enabled:bg-[#365743] enabled:hover:bg-[#2d4938] disabled:cursor-not-allowed disabled:opacity-90"
                >
                  Continue
                </button>
              </form>
            )}

            {authStep === "signup" && (
              <form onSubmit={handleSignupContinue} className="flex flex-col">
                <h2 id="auth-title" className="text-center text-lg font-semibold text-zinc-950">
                  Continue your account
                </h2>
                <label className="mt-5 text-xs font-medium text-zinc-950" htmlFor="display-name">
                  Enter email address
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Email address"
                  autoComplete="name"
                  className="mt-1.5 h-11 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
                />
                <label className="mt-4 text-xs font-medium text-zinc-950" htmlFor="new-password">
                  Create a password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="new-password"
                  className="mt-1.5 h-11 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
                />
                <button
                  type="submit"
                  disabled={!displayName.trim() || !newPassword}
                  className="mt-4 h-[43px] rounded-xl bg-[#9eaca4] text-sm font-medium text-white transition-colors enabled:bg-[#365743] enabled:hover:bg-[#2d4938] disabled:cursor-not-allowed disabled:opacity-90"
                >
                  Continue
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M16.2 9.2c0-.6-.1-1.1-.2-1.6H9v3h4c-.2 1-.8 1.8-1.6 2.3v1.9H14c1.4-1.3 2.2-3.2 2.2-5.6Z" />
      <path fill="#34A853" d="M9 16.5c2 0 3.7-.7 5-1.8l-2.5-1.9c-.7.5-1.5.7-2.5.7-1.9 0-3.5-1.3-4.1-3H2.3v2C3.5 14.9 6.1 16.5 9 16.5Z" />
      <path fill="#FBBC05" d="M4.9 10.5a4.5 4.5 0 0 1 0-3V5.6H2.3a7.5 7.5 0 0 0 0 6.8l2.6-1.9Z" />
      <path fill="#EA4335" d="M9 4.5c1.1 0 2 .4 2.8 1.1L14 3.5a7.4 7.4 0 0 0-5-2C6.1 1.5 3.5 3.1 2.3 5.6l2.6 1.9c.6-1.7 2.2-3 4.1-3Z" />
    </svg>
  );
}

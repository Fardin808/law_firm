
"use client";

import { API_BASE_URL } from "@/lib/api";
import { FormEvent, useState } from "react";
import {
  Eye,
  EyeOff,
  Scale,
  Mail,
  LockKeyhole,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass = `
    h-[48px] w-full rounded-md border border-[#d8dde3]
    bg-white pl-11 pr-4 text-[14px] text-gray-900
    outline-none transition placeholder:text-gray-400
    focus:border-[#b58a43] focus:ring-2
    focus:ring-[#b58a43]/10
  `;

  const switchMode = () => {
    setIsRegistering((prev) => !prev);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  // LOGIN
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      // Save JWT
      if (keepSignedIn) {
        localStorage.setItem("token", data.token);
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("token", data.token);
        localStorage.removeItem("token");
      }

      // Save user
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // REGISTER ADMIN ACCOUNT
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            email: normalizedEmail,
            password,
            // Do not send role.
            // The backend assigns Admin access.
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Account creation failed.");
        return;
      }

      // Registration succeeded.
      // Switch to login because the register endpoint
      // does not return a JWT token.
      setEmail(normalizedEmail);
      setName("");
      setPassword("");
      setConfirmPassword("");
      setIsRegistering(false);
      setSuccess(
        data.message || "Admin account created successfully. Please sign in."
      );
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT IMAGE SECTION */}

        <section className="relative hidden min-h-screen overflow-hidden bg-[#071727] lg:block">

          <img
            src="/images/law-login.jpg"
            alt="Law office"
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable={false}
          />

          <div className="absolute inset-0 bg-[#03101c]/20" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#03101c]/75 via-transparent to-[#03101c]/10" />

          {/* Logo */}
          <div className="absolute left-12 top-10 z-10 flex items-center gap-3">

            <Scale
              size={35}
              strokeWidth={1.5}
              className="text-[#d1a34c]"
            />

            <div>
              <h2 className="font-serif text-[24px] font-semibold tracking-[0.12em] text-white">
                LAW FIRM
              </h2>

              <div className="mt-2 h-[1px] w-14 bg-[#d1a34c]" />
            </div>

          </div>

          {/* Quote */}
          <div className="absolute bottom-10 left-6 z-10 max-w-[520px] pr-10">

            <div className="mb-5 h-[2px] w-14 bg-[#d1a34c]" />

            <blockquote className="font-serif text-[31px] leading-[1.3] text-white drop-shadow-md">
              “Justice is not just a goal,
              <br />
              it&apos;s our commitment.”
            </blockquote>

            <p className="mt-5 text-[12px] tracking-[0.18em] text-gray-200">
              EXPERIENCE • INTEGRITY • RESULTS
            </p>

          </div>

        </section>

        {/* RIGHT AUTHENTICATION SECTION */}

        <section className="flex min-h-screen items-center justify-center bg-white px-6 py-8 sm:px-10 lg:px-16">

          <div className="w-full max-w-[450px]">

            {/* Mobile Logo */}
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="text-center">

                <Scale
                  size={40}
                  strokeWidth={1.4}
                  className="mx-auto text-[#a97828]"
                />

                <h2 className="mt-2 font-serif text-xl font-semibold tracking-[0.12em] text-[#081b2e]">
                  LAW FIRM
                </h2>

              </div>
            </div>

            {/* Desktop Logo */}
            <div className="mb-6 hidden text-center lg:block">

              <Scale
                size={44}
                strokeWidth={1.35}
                className="mx-auto text-[#a97828]"
              />

              <h1 className="mt-2 font-serif text-[24px] font-semibold tracking-[0.08em] text-[#101820]">
                LAW FIRM
              </h1>

              <p className="mt-1 text-[9px] font-medium tracking-[0.16em] text-gray-500">
                JUSTICE BUILDS A BETTER TOMORROW
              </p>

            </div>

            {/* Welcome */}
            <div className="mb-5 text-center">

              <h2 className="font-serif text-[28px] font-semibold text-[#101820]">
                {isRegistering ? "Create Admin Account" : "Welcome Back"}
              </h2>

              <p className="mt-1 text-[14px] text-gray-500">
                {isRegistering
                  ? "Register to access the management system"
                  : "Sign in to access your account"}
              </p>

            </div>

            {/* AUTHENTICATION FORM */}

            <form onSubmit={isRegistering ? handleRegister : handleLogin}>

              {/* NAME - REGISTRATION ONLY */}

              {isRegistering && (
                <div className="mb-4">

                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-[#263746]"
                  >
                    Full Name
                  </label>

                  <div className="relative">

                    <User
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                      className={inputClass}
                    />

                  </div>
                </div>
              )}

              {/* EMAIL */}

              <div className="mb-4">

                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-[#263746]"
                >
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    className={inputClass}
                  />

                </div>
              </div>

              {/* PASSWORD */}

              <div className="mb-4">

                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-[#263746]"
                >
                  Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={
                      isRegistering ? "new-password" : "current-password"
                    }
                    minLength={isRegistering ? 6 : undefined}
                    required
                    className={`${inputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0b2945]"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>
              </div>

              {/* CONFIRM PASSWORD - REGISTRATION ONLY */}

              {isRegistering && (
                <div className="mb-4">

                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-sm font-medium text-[#263746]"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">

                    <LockKeyhole
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      className={inputClass}
                    />

                  </div>
                </div>
              )}

              {/* ERROR MESSAGE */}

              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-md border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              {/* SUCCESS MESSAGE */}

              {success && (
                <div
                  role="status"
                  className="mb-4 rounded-md border border-green-100 bg-green-50 px-4 py-2.5 text-sm text-green-700"
                >
                  {success}
                </div>
              )}

              {/* REMEMBER ME + FORGOT PASSWORD */}

              {!isRegistering && (
                <div className="mb-5 flex items-center justify-between gap-4">

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">

                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="h-4 w-4 accent-[#0b2945]"
                    />

                    Remember me

                  </label>

                  <button
                    type="button"
                    className="text-sm font-medium text-[#a97828] transition hover:text-[#805b1d] hover:underline"
                  >
                    Forgot password?
                  </button>

                </div>
              )}

              {/* SUBMIT BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="
                  h-[50px] w-full rounded-md bg-[#0b2945]
                  text-[14px] font-semibold tracking-wide text-white
                  shadow-sm transition duration-200 hover:bg-[#071e34]
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {loading
                  ? isRegistering
                    ? "Creating Account..."
                    : "Signing In..."
                  : isRegistering
                    ? "Create Admin Account"
                    : "Sign In"}
              </button>

              {/* DIVIDER */}

              <div className="my-5 flex items-center gap-4">

                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-[10px] tracking-wider text-gray-400">
                  {isRegistering ? "ADMIN REGISTRATION" : "SECURE LOGIN"}
                </span>

                <div className="h-px flex-1 bg-gray-200" />

              </div>

              {/* SWITCH LOGIN / REGISTER */}

              <p className="text-center text-[13px] text-gray-500">

                {isRegistering
                  ? "Already have an account?"
                  : "New to the system?"}

                <button
                  type="button"
                  onClick={switchMode}
                  disabled={loading}
                  className="ml-1.5 font-semibold text-[#a97828] transition hover:text-[#805b1d] hover:underline disabled:opacity-50"
                >
                  {isRegistering ? "Sign In" : "Create Admin Account"}
                </button>

              </p>

              {/* REGISTRATION NOTICE */}

              {isRegistering && (
                <p className="mt-4 text-center text-[11px] leading-4 text-amber-700">
                  Demo access: every newly registered account receives Admin privileges.
                  Use demo data only.
                </p>
              )}

              {/* FOOTER */}

              <p className="mt-5 text-center text-[11px] leading-4 text-gray-400">
                Protected access to the LAW FIRM management system.
              </p>

            </form>

          </div>

        </section>

      </div>
    </main>
  );
}

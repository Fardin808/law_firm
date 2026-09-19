"use client";

import { API_BASE_URL } from "@/lib/api";

import { FormEvent, useState } from "react";
import {
  Eye,
  EyeOff,
  Scale,
  Mail,
  LockKeyhole,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "${API_BASE_URL}/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
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

  return (
    <main className="h-screen overflow-hidden bg-white">
      <div className="grid h-full lg:grid-cols-2">

        {/* ========================================= */}
        {/* LEFT IMAGE SECTION */}
        {/* ========================================= */}

        <section className="relative hidden h-full overflow-hidden bg-[#071727] lg:block">

          {/* Actual Image */}
          <img
            src="/images/law-login.jpg"
            alt="Law office"
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable={false}
          />

          {/* Light dark overlay */}
          <div className="absolute inset-0 bg-[#03101c]/20" />

          {/* Slight bottom gradient for quote readability */}
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

        {/* ========================================= */}
        {/* RIGHT LOGIN SECTION */}
        {/* ========================================= */}

        <section className="flex h-full items-center justify-center bg-white px-6 py-5 sm:px-10 lg:px-16">

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
                Welcome Back
              </h2>

              <p className="mt-1 text-[14px] text-gray-500">
                Sign in to access your account
              </p>

            </div>

            {/* ========================================= */}
            {/* LOGIN FORM */}
            {/* ========================================= */}

            <form onSubmit={handleLogin}>

              {/* EMAIL */}

              <div className="mb-4">

                <label className="mb-1.5 block text-sm font-medium text-[#263746]">
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="
                      h-[48px]
                      w-full
                      rounded-md
                      border
                      border-[#d8dde3]
                      bg-white
                      pl-11
                      pr-4
                      text-[14px]
                      text-gray-900
                      outline-none
                      transition
                      placeholder:text-gray-400
                      focus:border-[#b58a43]
                      focus:ring-2
                      focus:ring-[#b58a43]/10
                    "
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="mb-4">

                <label className="mb-1.5 block text-sm font-medium text-[#263746]">
                  Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="
                      h-[48px]
                      w-full
                      rounded-md
                      border
                      border-[#d8dde3]
                      bg-white
                      pl-11
                      pr-12
                      text-[14px]
                      text-gray-900
                      outline-none
                      transition
                      placeholder:text-gray-400
                      focus:border-[#b58a43]
                      focus:ring-2
                      focus:ring-[#b58a43]/10
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
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

              {/* ERROR */}

              {error && (
                <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* REMEMBER + FORGOT */}

              <div className="mb-5 flex items-center justify-between gap-4">

                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">

                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) =>
                      setKeepSignedIn(e.target.checked)
                    }
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

              {/* SIGN IN */}

              <button
                type="submit"
                disabled={loading}
                className="
                  h-[50px]
                  w-full
                  rounded-md
                  bg-[#0b2945]
                  text-[14px]
                  font-semibold
                  tracking-wide
                  text-white
                  shadow-sm
                  transition
                  duration-200
                  hover:bg-[#071e34]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              {/* DIVIDER */}

              <div className="my-5 flex items-center gap-4">

                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-[10px] tracking-wider text-gray-400">
                  SECURE LOGIN
                </span>

                <div className="h-px flex-1 bg-gray-200" />

              </div>

              {/* FOOTER */}

              <p className="text-center text-[11px] leading-4 text-gray-400">
                Protected access to the LAW FIRM management system.
              </p>

            </form>

          </div>

        </section>

      </div>
    </main>
  );
}

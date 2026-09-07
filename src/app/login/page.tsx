"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label } from "@/components/ui";

const DEMOS = [
  { role: "Principal", email: "principal@masomo-demo.ug" },
  { role: "Admin", email: "admin@masomo-demo.ug" },
  { role: "Teacher", email: "teacher@masomo-demo.ug" },
  { role: "Bursar", email: "bursar@masomo-demo.ug" },
  { role: "Student", email: "student@masomo-demo.ug" },
  { role: "Guardian", email: "guardian@masomo-demo.ug" },
];
const DEMO_PASSWORD = "Masomo@2026";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      if (res.code === "locked_out") {
        setError("Too many failed attempts. This account is temporarily locked — please try again in 15 minutes.");
      } else {
        setError("Incorrect email or password. Please try again.");
      }
      return;
    }
    router.push("/redirect");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 sm:p-10">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">M</div>
            <span className="font-semibold text-lg">Masomo</span>
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">Sign in to your school</h1>
          <p className="text-sm text-slate-500 mt-1">Use the email and password your school gave you.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.ug" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="text-xs text-slate-400 mt-6">
            Forgotten your password? Ask your school administrator to reset it from the Admin panel.
          </p>
        </div>

        <div className="bg-brand-900 text-white p-8 sm:p-10 flex flex-col justify-center">
          <h2 className="font-semibold text-lg">Try a demo account</h2>
          <p className="text-sm text-white/70 mt-1">
            Explore every role on the Masomo Demo Secondary School tenant. Password for all demo accounts:
          </p>
          <code className="mt-2 inline-block bg-white/10 rounded-lg px-3 py-1.5 text-sm w-fit">{DEMO_PASSWORD}</code>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {DEMOS.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="text-left bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="text-sm font-medium">{d.role}</div>
                <div className="text-xs text-white/60 truncate">{d.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

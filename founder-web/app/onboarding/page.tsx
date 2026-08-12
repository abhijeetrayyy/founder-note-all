"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateProfile, createTask } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [energy, setEnergy] = React.useState(1);
  const [task, setTask] = React.useState("");
  const [firstStep, setFirstStep] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function finish() {
    setPending(true);
    const profileForm = new FormData();
    profileForm.set("display_name", name);
    profileForm.set("energy_default", String(energy));
    profileForm.set("onboarding_completed", "true");
    const [profileResult] = await Promise.all([
      updateProfile(profileForm),
      task.trim()
        ? createTask((() => {
            const f = new FormData();
            f.set("title", task.trim());
            f.set("energy_level", String(energy));
            f.set("priority", "2");
            if (firstStep.trim()) f.set("first_step", firstStep.trim());
            return f;
          })())
        : Promise.resolve(null),
    ]);
    setPending(false);
    if (profileResult?.error) { toast.show(profileResult.error, "error"); return; }
    toast.show("You're set up. Let's go.", "success");
    router.push("/today");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 text-white flex items-center justify-center text-sm font-extrabold font-display">F</span>
          <span className="font-bold text-lg tracking-tight text-foreground font-display">Founder<span className="text-gradient">OS</span></span>
        </div>

        <Card variant="focused" className="p-8">
          <div className="flex gap-1.5 justify-center mb-7">
            {Array.from({ length: STEPS }).map((_, s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? "bg-accent w-8" : "bg-base-border w-4"}`} />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-5 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent-600 to-accent-700 text-white flex items-center justify-center text-2xl font-extrabold font-display">F</div>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-display">You don&apos;t need a bigger list.</h1>
                <p className="mt-2.5 text-sm text-foreground-muted leading-relaxed">
                  You need one clear next step. FounderOS picks it for you, helps you break it down
                  when it&apos;s too big, and shows you the momentum you build along the way.
                </p>
              </div>
              <Button onClick={() => setStep(1)} className="w-full h-12">Let&apos;s set it up</Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">What should we call you?</h2>
                <p className="mt-1 text-sm text-foreground-muted">Shows up wherever FounderOS talks to you.</p>
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) setStep(2); }}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-11">Back</Button>
                <Button onClick={() => setStep(2)} disabled={!name.trim()} className="flex-1 h-11">Next</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">How&apos;s your energy, generally?</h2>
                <p className="mt-1 text-sm text-foreground-muted">FounderOS matches tasks to how you actually feel — change this anytime.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 0, label: "Admin", color: "#14B8A6", desc: "Quick, low-focus" },
                  { value: 1, label: "Medium", color: "#3B82F6", desc: "Balanced focus" },
                  { value: 2, label: "Deep", color: "#8B5CF6", desc: "High-focus" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEnergy(opt.value)}
                    className={`min-w-0 p-2.5 sm:p-3.5 rounded-xl border-2 text-center transition-all duration-200 focus-ring ${energy === opt.value ? "" : "border-base-border hover:border-accent/30"}`}
                    style={energy === opt.value ? { backgroundColor: `${opt.color}14`, borderColor: opt.color } : undefined}
                    aria-pressed={energy === opt.value}
                  >
                    <div className="text-sm font-bold truncate" style={{ color: energy === opt.value ? opt.color : undefined }}>{opt.label}</div>
                    <div className="text-2xs mt-1 text-foreground-muted leading-snug">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1 h-11">Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">What&apos;s on your mind right now?</h2>
                <p className="mt-1 text-sm text-foreground-muted">One thing you&apos;ve been putting off. We&apos;ll help you start it.</p>
              </div>
              <Input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g. Reply to the investor email"
                autoFocus
              />
              {task.trim() && (
                <Input
                  value={firstStep}
                  onChange={(e) => setFirstStep(e.target.value)}
                  placeholder="Smallest first step (optional)"
                />
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-11">Back</Button>
                <Button onClick={finish} disabled={pending} className="flex-1 h-11">
                  {pending ? "Setting up…" : task.trim() ? "Start with this" : "Skip for now"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

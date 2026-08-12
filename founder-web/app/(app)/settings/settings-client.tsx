"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateProfile, exportUserData, deleteAccount } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/lib/supabase/types";

export function SettingsClient({ profile }: { profile: UserProfile | null }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await updateProfile(form);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show("Profile updated", "success");
      router.refresh();
    }
  }

  async function handleExport() {
    const data = await exportUserData();
    if ("error" in data) {
      toast.show(data.error ?? "Export failed", "error");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `founderos-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show("Data exported", "success");
  }

  async function handleDelete() {
    if (!confirm("This will permanently delete your account and all data. Are you absolutely sure?")) return;
    if (!confirm("Type 'DELETE' in the next prompt to confirm.")) return;
    const typed = prompt("Type DELETE to confirm account deletion:");
    if (typed !== "DELETE") {
      toast.show("Deletion cancelled", "info");
      return;
    }
    await deleteAccount();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input name="display_name" defaultValue={profile?.display_name ?? ""} placeholder="Display name" label="Display name" />
        <Select name="energy_default" label="Default energy level" defaultValue={String(profile?.energy_default ?? 1)}>
          <option value="0">Admin</option>
          <option value="1">Medium</option>
          <option value="2">Deep</option>
        </Select>
        <Button type="submit" className="w-full h-12" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <div className="pt-4 border-t border-base-border space-y-3">
        <p className="text-2xs uppercase tracking-wider font-bold text-foreground-muted">Data</p>
        <Button variant="outline" onClick={handleExport} className="w-full h-11">
          Export all data (JSON)
        </Button>
        <Button variant="outline" onClick={handleDelete} className="w-full h-11 text-state-overdue hover:bg-state-overdue-surface">
          Delete account
        </Button>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/lib/supabase/types";

export function SettingsForm({ profile }: { profile: UserProfile | null }) {
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

  return (
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
  );
}

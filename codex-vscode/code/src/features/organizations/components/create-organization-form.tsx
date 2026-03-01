"use client";

import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserTrpcClient } from "@/lib/trpc/client";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await getBrowserTrpcClient().organization.create.mutate({
        name,
        slug,
      });

      router.replace("/dashboard");
      router.refresh();
    } catch (unknownError: unknown) {
      if (unknownError instanceof TRPCClientError) {
        setError(unknownError.message);
      } else {
        setError("Unable to create organization.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <form className="surface stack p-5" onSubmit={onSubmit}>
      <h2 className="text-lg font-bold">Create Organization</h2>
      <p className="text-sm text-[var(--ink-soft)]">
        Create a new organization and become its owner.
      </p>

      <div>
        <label className="label" htmlFor="organization-name">
          Name
        </label>
        <input
          id="organization-name"
          className="input"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="organization-slug">
          Slug
        </label>
        <div className="flex gap-2">
          <input
            id="organization-slug"
            className="input"
            type="text"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
          <button
            className="button button-outline"
            type="button"
            onClick={() => setSlug(toSlug(name))}
          >
            Suggest
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Lowercase letters, numbers, and single dashes.
        </p>
      </div>

      {error !== null ? <p className="text-sm text-red-700">{error}</p> : null}

      <button className="button button-brand" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create organization"}
      </button>
    </form>
  );
}

"use client";

import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";

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
  const { update: updateSession } = useSession();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const utils = trpc.useUtils();
  const createMutation = trpc.organization.create.useMutation({
    onSuccess: async () => {
      utils.organization.listPublic.invalidate();
      await updateSession();
      router.replace("/dashboard");
      router.refresh();
    },
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.reset();

    createMutation.mutate(
      { name, slug },
      {
        onSuccess: () => {
          setName("");
          setSlug("");
        },
      },
    );
  };

  const error =
    createMutation.error instanceof TRPCClientError
      ? createMutation.error.message
      : createMutation.error
        ? "Unable to create organization."
        : null;

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-bold">Create Organization</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Create a new organization and become its owner.
      </p>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
          htmlFor="organization-name"
        >
          Name
        </label>
        <input
          id="organization-name"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
          htmlFor="organization-slug"
        >
          Slug
        </label>
        <div className="flex gap-2">
          <input
            id="organization-slug"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            type="text"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
          <button
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            type="button"
            onClick={() => setSlug(toSlug(name))}
          >
            Suggest
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Lowercase letters, numbers, and single dashes.
        </p>
      </div>

      {error !== null ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <button
        className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Creating..." : "Create organization"}
      </button>
    </form>
  );
}

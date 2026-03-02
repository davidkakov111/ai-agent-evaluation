"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function JoinRequestList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery(
    trpc.joinRequest.listPending.queryOptions(),
  );

  const reviewMutation = useMutation(
    trpc.joinRequest.review.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.joinRequest.listPending.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.org.members.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(err.message);
        queryClient.invalidateQueries({
          queryKey: trpc.joinRequest.listPending.queryKey(),
        });
      },
    }),
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading requests...</p>;
  }

  if (!requests?.length) {
    return (
      <p className="text-sm text-muted-foreground">No pending join requests.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <JoinRequestRow
            key={request.id}
            request={request}
            onReview={(action, role) =>
              reviewMutation.mutate({
                requestId: request.id,
                action,
                role,
              })
            }
            isPending={reviewMutation.isPending}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function JoinRequestRow({
  request,
  onReview,
  isPending,
}: {
  request: {
    id: string;
    user: { id: string; email: string; name: string };
  };
  onReview: (
    action: "APPROVED" | "REJECTED",
    role?: "ADMIN" | "EMPLOYEE",
  ) => void;
  isPending: boolean;
}) {
  const [role, setRole] = useState<"ADMIN" | "EMPLOYEE">("EMPLOYEE");

  return (
    <TableRow>
      <TableCell className="font-medium">{request.user.name}</TableCell>
      <TableCell>{request.user.email}</TableCell>
      <TableCell>
        <Select
          value={role}
          onValueChange={(v) => setRole(v as "ADMIN" | "EMPLOYEE")}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EMPLOYEE">Employee</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            onClick={() => onReview("APPROVED", role)}
            disabled={isPending}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReview("REJECTED")}
            disabled={isPending}
          >
            Reject
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

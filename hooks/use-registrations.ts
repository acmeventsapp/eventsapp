"use client";

import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  createRegistration,
  deleteRegistration,
  adminUpdateRegistration,
  adminUpdateRegistrationStatus,
  getRegistrationById,
  getRegistrations,
  lookupRegistrationForTagReprint,
  type CreateRegistrationInput,
} from "@/data/registrations";
import type { PaymentStatus, RegistrationStatus } from "@prisma/client";
import type { AdminUpdateRegistrationValues } from "@/validators/schemas/registration-admin";
import type { DynamicRegistrationValues } from "@/validators/schemas/registration";

export const REGISTRATION_KEYS = {
  all: ["registrations"] as const,
  list: (filters?: {
    eventId?: string;
    status?: RegistrationStatus;
    paymentStatus?: PaymentStatus;
  }) => ["registrations", "list", filters ?? {}] as const,
  detail: (id: string) => ["registrations", "detail", id] as const,
};

export function useRegistrations(filters?: {
  eventId?: string;
  status?: RegistrationStatus;
  paymentStatus?: PaymentStatus;
}) {
  return useQuery(REGISTRATION_KEYS.list(filters), () => getRegistrations(filters));
}

export function useRegistration(id?: string) {
  return useQuery(REGISTRATION_KEYS.detail(id ?? ""), () => getRegistrationById(id!), {
    enabled: Boolean(id),
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();
  return useMutation((data: CreateRegistrationInput) => createRegistration(data), {
    onSuccess: () => queryClient.invalidateQueries(REGISTRATION_KEYS.all),
  });
}

export function useLookupRegistrationForReprint() {
  return useMutation(lookupRegistrationForTagReprint);
}

export function useDeleteRegistration() {
  const queryClient = useQueryClient();
  return useMutation((id: string) => deleteRegistration(id), {
    onSuccess: () => queryClient.invalidateQueries(REGISTRATION_KEYS.all),
  });
}

export function useUpdateRegistrationStatus() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: AdminUpdateRegistrationValues }) =>
      adminUpdateRegistrationStatus(id, data),
    {
      onSuccess: () => queryClient.invalidateQueries(REGISTRATION_KEYS.all),
    }
  );
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, responses }: { id: string; responses: DynamicRegistrationValues }) =>
      adminUpdateRegistration(id, { responses }),
    {
      onSuccess: () => queryClient.invalidateQueries(REGISTRATION_KEYS.all),
    }
  );
}

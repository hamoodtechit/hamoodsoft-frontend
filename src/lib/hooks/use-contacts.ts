"use client"

import { contactsApi, type ContactsListParams } from "@/lib/api/contacts"
import { CreateContactInput, UpdateContactInput } from "@/lib/validations/contacts"
import { Contact } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useContacts(params?: ContactsListParams) {
  const queryKey = [
    "contacts",
    params?.page ?? 1,
    params?.limit ?? 10,
    params?.search ?? "",
    params?.type ?? null,
    params?.isIndividual ?? null,
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => contactsApi.getContacts(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ["contact", id],
    queryFn: () => contactsApi.getContactById(id!),
    enabled: !!id,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateContactInput) => contactsApi.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      toast.success("Contact created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create contact. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactInput }) =>
      contactsApi.updateContact(id, data),
    onSuccess: (updatedContact: Contact) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      queryClient.invalidateQueries({ queryKey: ["contact", updatedContact.id] })
      toast.success("Contact updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update contact. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contactsApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      toast.success("Contact deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete contact. Please try again."
      toast.error(message)
    },
  })
}

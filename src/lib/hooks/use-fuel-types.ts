import { fuelTypesApi } from "@/lib/api/fuel-types";
import { CreateFuelTypeInput } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useFuelTypes(params: { page?: number; limit?: number; search?: string; isActive?: boolean } = { limit: 1000 }) {
  return useQuery({
    queryKey: ["fuel-types", params],
    queryFn: () => fuelTypesApi.list(params),
  })
}

export function useCreateFuelType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFuelTypeInput) => fuelTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-types"] })
      toast.success("Fuel type created successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create fuel type")
    },
  })
}

export function useDeleteFuelType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fuelTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-types"] })
      toast.success("Fuel type deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete fuel type")
    },
  })
}

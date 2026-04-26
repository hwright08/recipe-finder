import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createKitchenItem, deleteKitchenItem, fetchKitchenItems, updateKitchenItem } from "../lib/api";
import { queryKeys } from "../lib/query";
import type { AuthUser, KitchenFoodItem } from "../types";

export function useKitchenItems(token: string, user: AuthUser | null) {
  const queryClient = useQueryClient();
  const kitchenItemsQuery = useQuery({
    queryKey: queryKeys.kitchenItems(token),
    queryFn: () => fetchKitchenItems(token),
    enabled: Boolean(token && user),
    retry: false
  });
  const createKitchenItemMutation = useMutation({
    mutationFn: (input: { name: string }) => createKitchenItem(token, input),
    onSuccess: (data) => {
      queryClient.setQueryData<{ items: KitchenFoodItem[] }>(
        queryKeys.kitchenItems(token),
        (current) => ({
          items: [data.item, ...(current?.items ?? []).filter((item) => item.id !== data.item.id)]
        })
      );
    }
  });
  const updateKitchenItemMutation = useMutation({
    mutationFn: (input: { item: KitchenFoodItem; isLow: boolean }) =>
      updateKitchenItem(token, input.item.id, input.isLow),
    onMutate: async ({ item, isLow }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.kitchenItems(token) });
      const previous = queryClient.getQueryData<{ items: KitchenFoodItem[] }>(
        queryKeys.kitchenItems(token)
      );

      queryClient.setQueryData<{ items: KitchenFoodItem[] }>(
        queryKeys.kitchenItems(token),
        (current) => ({
          items: (current?.items ?? []).map((currentItem) =>
            currentItem.id === item.id ? { ...currentItem, isLow } : currentItem
          )
        })
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.kitchenItems(token), context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ items: KitchenFoodItem[] }>(
        queryKeys.kitchenItems(token),
        (current) => ({
          items: (current?.items ?? []).map((item) => (item.id === data.item.id ? data.item : item))
        })
      );
    }
  });
  const deleteKitchenItemMutation = useMutation({
    mutationFn: (item: KitchenFoodItem) => deleteKitchenItem(token, item.id),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.kitchenItems(token) });
      const previous = queryClient.getQueryData<{ items: KitchenFoodItem[] }>(
        queryKeys.kitchenItems(token)
      );

      queryClient.setQueryData<{ items: KitchenFoodItem[] }>(
        queryKeys.kitchenItems(token),
        (current) => ({
          items: (current?.items ?? []).filter((currentItem) => currentItem.id !== item.id)
        })
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.kitchenItems(token), context.previous);
      }
    }
  });

  return {
    createKitchenItemMutation,
    deleteKitchenItemMutation,
    kitchenItems: kitchenItemsQuery.data?.items ?? [],
    kitchenItemsQuery,
    updateKitchenItemMutation
  };
}

import type { FormEvent } from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Plus, X } from "lucide-react";
import { useAuthContext } from "../App";
import { useKitchenItems } from "../hooks/useKitchenItems";
import type { KitchenFoodItem } from "../types";

export function KitchenInventory() {
  const { token, user } = useAuthContext();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const {
    createKitchenItemMutation,
    deleteKitchenItemMutation,
    kitchenItems,
    kitchenItemsQuery,
    updateKitchenItemMutation
  } = useKitchenItems(token, user);

  async function handleKitchenItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const itemNames = String(formData.get("names") ?? "")
      .split(/\r?\n/)
      .map((name) => name.trim())
      .filter(Boolean);

    if (itemNames.length === 0) {
      return;
    }

    await Promise.all(itemNames.map((name) => createKitchenItemMutation.mutateAsync({ name })));
    form.reset();
    setIsAddFormOpen(false);
  }

  function handleLowToggle(item: KitchenFoodItem, isLow: boolean) {
    if (!token) {
      return;
    }

    updateKitchenItemMutation.mutate({ item, isLow });
  }

  function handleDeleteItem(item: KitchenFoodItem) {
    if (!token) {
      return;
    }

    deleteKitchenItemMutation.mutate(item);
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.25 }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h2" sx={{ fontSize: "1.25rem", fontWeight: 800 }}>
            Kitchen
          </Typography>
          <Chip
            color={kitchenItems.some((item) => item.isLow) ? "warning" : "default"}
            label={`${kitchenItems.filter((item) => item.isLow).length} low`}
            size="small"
          />
        </Stack>

        {isAddFormOpen ? (
          <Stack component="form" spacing={2} onSubmit={handleKitchenItemSubmit}>
            <TextField
              name="names"
              label="Food items"
              placeholder={"Olive oil\nBlack beans\nCilantro"}
              required
              multiline
              minRows={4}
              disabled={!user || createKitchenItemMutation.isPending}
              fullWidth
            />
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="outlined"
                disabled={createKitchenItemMutation.isPending}
                startIcon={<X size={18} />}
                onClick={() => setIsAddFormOpen(false)}
                sx={{ minHeight: 44, px: 3 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!user || createKitchenItemMutation.isPending}
                startIcon={<Plus size={18} />}
                sx={{ minHeight: 44, px: 3 }}
              >
                Add items
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Button
            type="button"
            variant="contained"
            disabled={!user}
            startIcon={<Plus size={18} />}
            onClick={() => setIsAddFormOpen(true)}
            sx={{ alignSelf: "flex-start", minHeight: 44, px: 3 }}
          >
            Add items
          </Button>
        )}

        <hr />

        {!user ? <Alert severity="info">Log in to manage your kitchen inventory.</Alert> : null}
        {user && kitchenItemsQuery.isPending ? (
          <Typography color="text.secondary">Loading kitchen items...</Typography>
        ) : null}
        {user && !kitchenItemsQuery.isPending && kitchenItems.length === 0 ? (
          <Typography color="text.secondary">No kitchen items yet.</Typography>
        ) : null}

        <List disablePadding>
          {kitchenItems.map((item, index) => (
            <Box key={item.id}>
              {index > 0 ? <Divider component="li" /> : null}
              <ListItem disableGutters>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    width: "100%",
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between"
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    <Chip
                      label={item.isLow ? "Low" : "Stocked"}
                      color={item.isLow ? "warning" : "default"}
                      size="small"
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant={item.isLow ? "outlined" : "contained"}
                      color={item.isLow ? "primary" : "warning"}
                      size="small"
                      disabled={updateKitchenItemMutation.isPending}
                      onClick={() => handleLowToggle(item, !item.isLow)}
                    >
                      {item.isLow ? "Mark stocked" : "Mark low"}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={deleteKitchenItemMutation.isPending}
                      onClick={() => handleDeleteItem(item)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </ListItem>
            </Box>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}

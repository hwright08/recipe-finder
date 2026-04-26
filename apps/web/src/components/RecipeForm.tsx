import type { FormEvent } from "react";
import { useState } from "react";
import { Button, Paper, Stack, TextField } from "@mui/material";
import { Plus, X } from "lucide-react";
import { useAuthContext } from "../App";
import { useRecipes } from "../hooks/useRecipes";

export function RecipeForm() {
  const { token, user } = useAuthContext();
  const { createRecipeMutation } = useRecipes(token, user);
  const [isOpen, setIsOpen] = useState(false);

  async function handleRecipeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const foodItems = String(formData.get("foodItems") ?? "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    await createRecipeMutation
      .mutateAsync({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        source: String(formData.get("source") ?? ""),
        foodItems
      })
      .then(() => {
        form.reset();
        setIsOpen(false);
      });
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="contained"
        disabled={!user}
        startIcon={<Plus size={18} />}
        onClick={() => setIsOpen(true)}
        sx={{ alignSelf: "flex-start", minHeight: 44, px: 3 }}
      >
        Add recipe
      </Button>
    );
  }

  return (
    <Paper component="form" variant="outlined" sx={{ p: 2.25 }} onSubmit={handleRecipeSubmit}>
      <Stack spacing={2}>
        <TextField
          name="title"
          label="Recipe title"
          placeholder="Crispy tofu bowls"
          required
          fullWidth
        />
        <TextField name="source" label="Source" placeholder="Cookbook, URL, or person" fullWidth />
        <TextField
          name="description"
          label="Description"
          placeholder="Sauce, toppings, prep notes..."
          multiline
          minRows={2}
          fullWidth
        />
        <TextField
          name="foodItems"
          label="Food items"
          placeholder={"Tofu\nRice\nScallions"}
          multiline
          minRows={4}
          fullWidth
        />
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outlined"
            disabled={createRecipeMutation.isPending}
            startIcon={<X size={18} />}
            onClick={() => setIsOpen(false)}
            sx={{ minHeight: 44, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!user || createRecipeMutation.isPending}
            startIcon={<Plus size={18} />}
            sx={{ minHeight: 44, px: 3 }}
          >
            Add recipe
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

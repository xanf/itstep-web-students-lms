import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select,
  MenuItem, Stack, CircularProgress, Alert,
} from "@mui/material";
import { materialsApi } from "../../api/materials";

const EMPTY_FORM = { title: "", kind: "Video", url: "", description: "" };

export default function MaterialFormDialog({ open, onClose, initial }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const handleEnter = () => {
    setForm(
      initial
        ? {
            title: initial.title,
            kind: initial.kind,
            url: initial.url || "",
            description: initial.description || "",
          }
        : EMPTY_FORM
    );
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const createMutation = useMutation({
    mutationFn: materialsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materials"] }); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: materialsApi.update,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materials"] }); onClose(); },
  });

  const mutation = initial ? updateMutation : createMutation;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (initial) {
      updateMutation.mutate({ id: initial.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" TransitionProps={{ onEnter: handleEnter }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initial ? "Редагувати матеріал" : "Новий матеріал"}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {mutation.isError && (
              <Alert severity="error">
                {mutation.error?.response?.data?.error?.message || "Помилка збереження"}
              </Alert>
            )}

            <TextField
              label="Назва"
              value={form.title}
              onChange={set("title")}
              required
              fullWidth
              size="small"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Тип</InputLabel>
              <Select value={form.kind} onChange={set("kind")} label="Тип">
                <MenuItem value="Video">Відео</MenuItem>
                <MenuItem value="Link">Посилання</MenuItem>
                <MenuItem value="File">Файл</MenuItem>
              </Select>
            </FormControl>

            {(form.kind === "Video" || form.kind === "Link") && (
              <TextField
                label={form.kind === "Video" ? "YouTube посилання" : "URL"}
                value={form.url}
                onChange={set("url")}
                fullWidth
                size="small"
                placeholder="https://..."
              />
            )}

            <TextField
              label="Опис"
              value={form.description}
              onChange={set("description")}
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Короткий опис матеріалу"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
            Скасувати
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={18} /> : "Зберегти"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

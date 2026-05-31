import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Card, CardContent, CardActions,
  IconButton, Chip, TextField, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel, Button,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, CircularProgress, Tooltip, Skeleton,
  Stack, Divider, Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import apiClient from "../../api/client";
import { useAuth } from "../../auth/useAuth";

// ─── API functions ────────────────────────────────────────────────────────────

const materialsApi = {
  getAll: (params) =>
    apiClient.get("/materials", { params }).then((r) => r.data),

  create: (body) =>
    apiClient.post("/materials", body).then((r) => r.data),

  update: ({ id, ...body }) =>
    apiClient.patch(`/materials/${id}`, body).then((r) => r.data),

  remove: (id) =>
    apiClient.delete(`/materials/${id}`),

  addFavorite: (id) =>
    apiClient.post(`/materials/${id}/favorite`).then((r) => r.data),

  removeFavorite: (id) =>
    apiClient.delete(`/materials/${id}/favorite`).then((r) => r.data),
};

// ─── Constants ────────────────────────────────────────────────────────────────

const KIND_LABELS = { Video: "Відео", Link: "Посилання", File: "Файл" };
const KIND_COLORS = { Video: "error", Link: "primary", File: "warning" };
const PAGE_SIZE = 12;

// ─── MaterialFormDialog ───────────────────────────────────────────────────────

function MaterialFormDialog({ open, onClose, initial }) {
  const qc = useQueryClient();

  const emptyForm = { title: "", kind: "Video", url: "", description: "" };
  const [form, setForm] = useState(emptyForm);

  // Sync form when dialog opens
  const handleEnter = () => {
    setForm(
      initial
        ? { title: initial.title, kind: initial.kind, url: initial.url || "", description: initial.description || "" }
        : emptyForm
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

// ─── MaterialCard ─────────────────────────────────────────────────────────────

function MaterialCard({ material, isInstructor, onEdit, onDelete }) {
  const qc = useQueryClient();

  const favMutation = useMutation({
    mutationFn: material.isFavorited
      ? () => materialsApi.removeFavorite(material.id)
      : () => materialsApi.addFavorite(material.id),
    // Optimistic update
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["materials"] });
      qc.setQueriesData({ queryKey: ["materials"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((m) =>
            m.id === material.id ? { ...m, isFavorited: !m.isFavorited } : m
          ),
        };
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });

  const href = material.url || material.fileUrl;

  return (
    <Card
      variant="outlined"
      sx={{ display: "flex", flexDirection: "column", height: "100%", borderRadius: 2 }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Title + chip */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1, lineHeight: 1.4 }}>
            {material.title}
          </Typography>
          <Chip
            label={KIND_LABELS[material.kind] || material.kind}
            color={KIND_COLORS[material.kind] || "default"}
            size="small"
            sx={{ flexShrink: 0 }}
          />
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {material.description || "\u00A0"}
        </Typography>
      </CardContent>

      

      <CardActions sx={{ px: 2, py: 1, justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {href && (
            <Button
              size="small"
              endIcon={<OpenInNewIcon fontSize="small" />}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              component="a"
            >
              Відкрити
            </Button>
          )}

          {isInstructor && (
            <>
              <Tooltip title="Редагувати">
                <IconButton size="small" onClick={() => onEdit(material)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Видалити">
                <IconButton size="small" color="error" onClick={() => onDelete(material)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        <Tooltip title={material.isFavorited ? "Прибрати з обраного" : "Додати до обраного"}>
          <IconButton
            size="small"
            onClick={() => favMutation.mutate()}
            disabled={favMutation.isPending}
            color={material.isFavorited ? "warning" : "default"}
          >
            {material.isFavorited ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Skeleton width="60%" height={22} />
          <Skeleton width={60} height={22} />
        </Box>
        <Skeleton width="100%" />
        <Skeleton width="85%" />
        <Skeleton width="70%" />
      </CardContent>
      <Divider />
      <CardActions sx={{ px: 2, py: 1, justifyContent: "space-between" }}>
        <Skeleton width={80} height={30} />
        <Skeleton variant="circular" width={28} height={28} />
      </CardActions>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MaterialsLibrary() {
  const { user } = useAuth();
  const isInstructor = user?.role === "Instructor";

  // Filters
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Reset page on filter change
  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleKind = (v) => { setKindFilter(v); setPage(1); };
  const handleFavOnly = (v) => { setFavoritesOnly(v); setPage(1); };

  // Form / delete state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch ──
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["materials", { page, search, kindFilter, favoritesOnly }],
    queryFn: () =>
      materialsApi.getAll({
        page,
        pageSize: PAGE_SIZE,
        ...(search && { q: search }),
        ...(kindFilter && { kind: kindFilter }),
        ...(favoritesOnly && { favoritesOnly: "true" }),
      }),
    keepPreviousData: true,
  });

  const materials = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, totalPages: 1 };

  // ── Delete ──
  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => materialsApi.remove(deleteTarget.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      setDeleteTarget(null);
    },
  });

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (mat) => { setEditTarget(mat); setFormOpen(true); };

  // ── Render ──
  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>

      {/* Header */}
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Бібліотека матеріалів
      </Typography>

      {/* Filters */}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Пошук матеріалів..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ flex: "1 1 260px", minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Тип</InputLabel>
          <Select value={kindFilter} onChange={(e) => handleKind(e.target.value)} label="Тип">
            <MenuItem value="">Всі типи</MenuItem>
            <MenuItem value="Video">Відео</MenuItem>
            <MenuItem value="Link">Посилання</MenuItem>
            <MenuItem value="File">Файл</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={favoritesOnly}
              onChange={(e) => handleFavOnly(e.target.checked)}
              size="small"
            />
          }
          label="Тільки обрані"
        />

        {isInstructor && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ ml: "auto" }}
          >
            Додати матеріал
          </Button>
        )}
      </Stack>

      {/* Error */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.response?.data?.error?.message || "Помилка завантаження матеріалів"}
        </Alert>
      )}

      {/* Grid */}
      {isLoading ? (
        <Grid container spacing={2}>
          {[...Array(PAGE_SIZE)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <SkeletonCard />
            </Grid>
          ))}
        </Grid>
      ) : materials.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
          <Typography fontSize={40} mb={1}>📚</Typography>
          <Typography>
            {favoritesOnly ? "Немає матеріалів в обраному" : "Матеріалів не знайдено"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {materials.map((m) => (
            <Grid item xs={12} sm={6} md={4} key={m.id}>
              <MaterialCard
                material={m}
                isInstructor={isInstructor}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 3, gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, meta.total)} of {meta.total}
          </Typography>
          <Pagination
            count={meta.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            shape="rounded"
            size="small"
          />
        </Box>
      )}

      {/* Form dialog (create / edit) */}
      <MaterialFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        initial={editTarget}
      />

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Видалити матеріал?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ви впевнені, що хочете видалити{" "}
            <strong>«{deleteTarget?.title}»</strong>?{" "}
            Цю дію неможливо скасувати.
          </DialogContentText>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {deleteMutation.error?.response?.data?.error?.message || "Помилка видалення"}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
            Скасувати
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={18} /> : "Видалити"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Stack, Button, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, CircularProgress, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../../auth/useAuth";
import { materialsApi } from "../../api/materials";
import { PAGE_SIZE } from "./constants";
import MaterialCard from "./MaterialCard";
import MaterialFormDialog from "./MaterialFormDialog";
import SkeletonCard from "./SkeletonCard";

export default function MaterialsLibrary() {
  const { user } = useAuth();
  const isInstructor = user?.role === "Instructor";

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);

  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleKind = (v) => { setKindFilter(v); setPage(1); };
  const handleFavOnly = (v) => { setFavoritesOnly(v); setPage(1); };

  // ── Form / delete state ──
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

      {/* Form dialog */}
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

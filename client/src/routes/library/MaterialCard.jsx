import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent, CardActions,
  Box, Typography, Chip, IconButton, Button, Tooltip,
} from "@mui/material";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { materialsApi } from "../../api/materials";
import { KIND_LABELS, KIND_COLORS } from "./constants";

export default function MaterialCard({ material, isInstructor, onEdit, onDelete }) {
  const qc = useQueryClient();

  const favMutation = useMutation({
    mutationFn: material.isFavorited
      ? () => materialsApi.removeFavorite(material.id)
      : () => materialsApi.addFavorite(material.id),
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
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ flex: 1, lineHeight: 1.4 }}
          >
            {material.title}
          </Typography>
          <Chip
            label={KIND_LABELS[material.kind] || material.kind}
            color={KIND_COLORS[material.kind] || "default"}
            size="small"
            sx={{ flexShrink: 0 }}
          />
        </Box>

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
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(material)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        <Tooltip
          title={
            material.isFavorited ? "Прибрати з обраного" : "Додати до обраного"
          }
        >
          <span>
            <IconButton
              size="small"
              onClick={() => favMutation.mutate()}
              disabled={favMutation.isPending}
              color={material.isFavorited ? "warning" : "default"}
            >
              {material.isFavorited ? (
                <StarIcon fontSize="small" />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

import { ListItem, ListItemIcon, ListItemText, Box, IconButton, Tooltip } from '@mui/material'
import {
  DragIndicator as DragIndicatorIcon,
  Article as ArticleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'

export function LessonItem({ lesson, index, onDelete }) {
  const navigate = useNavigate()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `lesson-${lesson.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    marginBottom: '8px',
    opacity: isDragging ? 0.6 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <ListItem
        style={{
          ...(isDragging ? { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } : {})
        }}
        sx={{
          bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.300'
        }}
      >
        <Box {...listeners} sx={{ mr: 2, display: 'flex', color: 'text.secondary', cursor: 'grab' }}>
          <DragIndicatorIcon fontSize="small" />
        </Box>
        <ListItemIcon sx={{ minWidth: 40 }}><ArticleIcon color="primary" /></ListItemIcon>
        <ListItemText
          primary={lesson.title}
          secondary={lesson.releaseAt ? `Публікація: ${dayjs(lesson.releaseAt).format('DD.MM.YYYY HH:mm')}` : 'Опубліковано відразу'}
        />
        <Tooltip title="Перейти до редактора лекції">
          <IconButton size="small" onClick={() => navigate(`/lessons/${lesson.id}/edit`)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Видалити лекцію">
          <IconButton size="small" color="error" onClick={() => onDelete(lesson)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ListItem>
    </div>
  )
}

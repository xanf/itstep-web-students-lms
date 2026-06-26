import { ListItem, ListItemIcon, ListItemText, Box, IconButton, Tooltip } from '@mui/material'
import {
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import dayjs from 'dayjs'

export function AssignmentItem({ assignment, sectionId, onEdit, onDelete }) {
  return (
    <ListItem
      sx={{ bgcolor: 'white', mb: 1, borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}
    >
      <Box sx={{ width: 20, mr: 2 }} />
      <ListItemIcon sx={{ minWidth: 40 }}>
        <AssignmentIcon color="secondary" />
      </ListItemIcon>
      <ListItemText
        primary={assignment.title}
        secondary={`Дедлайн: ${dayjs(assignment.dueAt).format('DD.MM.YYYY HH:mm')} | ${assignment.maxScore} балів`}
      />
      <Tooltip title="Налаштування завдання">
        <IconButton size="small" onClick={() => onEdit(assignment, sectionId)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Видалити завдання">
        <IconButton size="small" color="error" onClick={() => onDelete(assignment)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </ListItem>
  )
}

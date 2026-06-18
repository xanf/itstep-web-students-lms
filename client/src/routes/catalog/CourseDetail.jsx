import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AssignmentIcon from '@mui/icons-material/Assignment'
import EditIcon from '@mui/icons-material/Edit'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import SchoolIcon from '@mui/icons-material/School'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useAuth } from '../../auth/useAuth.js'
import { getCourse } from '../../api/courses.js'

function statusChipProps(status) {
  if (status === 'Published') return { label: 'Опубліковано', color: 'success' }
  if (status === 'Archived') return { label: 'В архіві', color: 'warning' }
  return { label: 'Чернетка', color: 'default' }
}

const FINAL_CONTROL_LABELS = {
  Exam: 'Екзамен',
  GradedPass: 'Диф. залік',
  Pass: 'Залік',
}

export function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId),
  })

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error?.message ?? 'Помилка завантаження'}</Alert>
      </Box>
    )
  }

  const isInstructor = user.role === 'Instructor'

  const course = data?.data ?? data

  const sections = course.sections ?? []
  const allLessons = sections.flatMap((s) => s.lessons ?? [])
  const allAssignments = sections.flatMap((s) => s.assignments ?? [])

  const finalControlLabel = FINAL_CONTROL_LABELS[course.finalControl] ?? course.finalControl ?? '—'

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Tooltip title="Назад">
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" fontWeight={700} sx={{ flexGrow: 1 }}>
          {course.title}
        </Typography>
        <Chip {...statusChipProps(course.status)} />
        {isInstructor && (
          <Tooltip title="Редагувати курс">
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/courses/${courseId}/build`)}
            >
              Редагувати
            </Button>
          </Tooltip>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Викладач: {course.instructor?.fullName} · Створено{' '}
        {dayjs(course.createdAt).locale('uk').format('MMM D, YYYY')}
      </Typography>

      {/* Властивості дисципліни */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Властивості дисципліни</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {course.creditsEcts != null && (
            <Chip
              icon={<SchoolIcon />}
              label={`${course.creditsEcts} кредитів ECTS`}
              variant="outlined"
              size="small"
            />
          )}
          {course.semester && (
            <Chip
              icon={<AccessTimeIcon />}
              label={course.semester}
              variant="outlined"
              size="small"
            />
          )}
          <Chip
            icon={<EmojiEventsIcon />}
            label={`Контроль: ${finalControlLabel}`}
            variant="outlined"
            size="small"
          />
        </Box>
        <Typography variant="body2" mt={2} color="text.secondary">
          Викладач: {course.instructor?.fullName} · {course.instructor?.email}
        </Typography>
      </Paper>

      {/* Про цей курс */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Про цей курс</Typography>
        <Typography variant="body1">
          {course.description || 'Опис відсутній.'}
        </Typography>
      </Paper>

      {/* Уроки */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Уроки ({allLessons.length})</Typography>
        {allLessons.length === 0 ? (
          <Typography color="text.secondary">Уроків ще немає.</Typography>
        ) : (
          <List dense disablePadding>
            {allLessons.map((lesson) => (
              <ListItem key={lesson.id} disablePadding>
                <ListItemButton onClick={() => navigate(`/lessons/${lesson.id}`)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <MenuBookIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={lesson.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Завдання */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>Завдання ({allAssignments.length})</Typography>
        {allAssignments.length === 0 ? (
          <Typography color="text.secondary">Завдань ще немає.</Typography>
        ) : (
          <List dense disablePadding>
            {allAssignments.map((assignment) => (
              <ListItem key={assignment.id} disablePadding>
                <ListItemButton onClick={() => navigate(`/assignments/${assignment.id}`)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <AssignmentIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={assignment.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  )
}

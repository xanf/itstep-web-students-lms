import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArticleIcon from '@mui/icons-material/Article'
import DeleteIcon from '@mui/icons-material/Delete'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import BuildIcon from '@mui/icons-material/Build'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import SchoolIcon from '@mui/icons-material/School'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useAuth } from '../../auth/useAuth.js'
import { createCourse, deleteCourse, enrollCourse, getCourse, getCourses, getEnrollments, hideEnrollment, unhideEnrollment, updateCourse } from '../../api/courses.js'

const PAGE_SIZE = 9

const SORT_OPTIONS = [
  { value: 'newest', label: 'Новіші', sort: 'createdAt', order: 'desc' },
  { value: 'oldest', label: 'Старіші', sort: 'createdAt', order: 'asc' },
  { value: 'title', label: 'За назвою', sort: 'title', order: 'asc' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Всі' },
  { value: 'Draft', label: 'Чернетка' },
  { value: 'Published', label: 'Опубліковано' },
  { value: 'Archived', label: 'В архіві' },
]

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function statusChipProps(status) {
  if (status === 'Published') return { label: 'Опубліковано', color: 'success' }
  if (status === 'Archived') return { label: 'В архіві', color: 'warning' }
  return { label: 'Чернетка', color: 'default' }
}


function formatDate(dateStr) {
  return dayjs(dateStr).locale('uk').format('MMM D, YYYY')
}

// ─── Shared card body ─────────────────────────────────────────────────────────

function CourseCardBody({ course }) {
  return (
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1, mr: 1 }}>
          {course.title}
        </Typography>
        <Chip {...statusChipProps(course.status)} size="small" />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <SchoolIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          {course.instructor?.fullName} · {formatDate(course.createdAt)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        {course.creditsEcts != null && (
          <Chip label={`${course.creditsEcts} ECTS`} variant="outlined" size="small" />
        )}
        {course.semester && (
          <Chip label={course.semester} variant="outlined" size="small" />
        )}
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {course.description}
      </Typography>
    </CardContent>
  )
}

// ─── Instructor view ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '',
  description: '',
  creditsEcts: 5,
  semester: '2026-Spring',
  finalControl: 'Exam',
  status: 'Draft',
}

function InstructorCatalog({ user }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [formDialog, setFormDialog] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleOpenCreate = () => {
    setFormData({ ...EMPTY_FORM })
    setFormDialog('create')
  }

  const handleOpenEdit = (course) => {
    setFormData({
      title: course.title,
      description: course.description ?? '',
      creditsEcts: course.creditsEcts ?? 5,
      semester: course.semester ?? '2026-Spring',
      finalControl: course.finalControl ?? 'Exam',
      status: course.status ?? 'Draft',
    })
    setFormDialog(course)
  }

  const handleCloseForm = () => {
    setFormDialog(null)
    setFormData(EMPTY_FORM)
  }

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['courses', { search: debouncedSearch, page, status: statusFilter, sort: sortBy }],
    queryFn: () =>
      getCourses({
        q: debouncedSearch,
        page: 1,
        pageSize: 100,
        status: statusFilter || undefined,
      }),
  })

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      handleCloseForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...fields }) => updateCourse(id, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      handleCloseForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setDeleteDialog(null)
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async (id) => {
      const source = await getCourse(id)
      const s = source?.data ?? source
      return createCourse({ title: `Copy of ${s.title}`, description: s.description, status: 'Draft' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })

  const allMyCourses = (data?.data ?? []).filter((c) => c.instructorId === user.id)

  const sortedMyCourses = [...allMyCourses].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title, 'uk')
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt)
    }
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  const totalPages = Math.ceil(sortedMyCourses.length / PAGE_SIZE)
  const courses = sortedMyCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      creditsEcts: Number(formData.creditsEcts),
    }
    if (formDialog === 'create') {
      createMutation.mutate(payload)
    } else {
      updateMutation.mutate({ id: formDialog.id, ...payload })
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Мої курси</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          placeholder="Пошук курсів..."
          value={search}
          onChange={handleSearchChange}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          size="small"
          displayEmpty
          sx={{ minWidth: 140 }}
        >
          {STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </Select>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          size="small"
          sx={{ minWidth: 140 }}
        >
          {SORT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </Select>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      )}
      {isError && (
        <Alert severity="error">{error?.message ?? 'Помилка завантаження'}</Alert>
      )}
      {!isLoading && !isError && courses.length === 0 && (
        <Typography color="text.secondary" textAlign="center" mt={4}>Курсів не знайдено</Typography>
      )}

      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CourseCardBody course={course} />

              <Divider />

              <CardActions sx={{ justifyContent: 'flex-start', gap: 0.5 }}>
                <Tooltip title="Переглянути">
                  <IconButton size="small" onClick={() => navigate(`/courses/${course.id}`)}>
                    <ArticleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Редагувати">
                  <IconButton size="small" onClick={() => handleOpenEdit(course)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Дублювати">
                  <IconButton size="small" disabled={duplicateMutation.isPending} onClick={() => duplicateMutation.mutate(course.id)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {course.status !== 'Archived' && (
                  <Tooltip title="Архівувати">
                    <IconButton size="small" onClick={() => updateMutation.mutate({ id: course.id, status: 'Archived' })}>
                      <ArchiveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {course.status === 'Archived' && (
                  <Tooltip title="Розархівувати">
                    <IconButton size="small" onClick={() => updateMutation.mutate({ id: course.id, status: 'Draft' })}>
                      <UnarchiveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Видалити">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteDialog(course)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      <Dialog open={Boolean(deleteDialog)} onClose={() => setDeleteDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Видалити курс</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити курс «{deleteDialog?.title}»?
            Це також видалить всі уроки та завдання курсу. Дію неможливо скасувати.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Скасувати</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteDialog.id)}
          >
            Видалити
          </Button>
        </DialogActions>
      </Dialog>

      <Fab color="primary" sx={{ position: 'fixed', top: 80, right: 24 }} onClick={handleOpenCreate}>
        <AddIcon />
      </Fab>

      <Dialog open={Boolean(formDialog)} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>
            {formDialog === 'create' ? 'Створити курс' : 'Редагувати курс'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField
              label="Назва курсу"
              value={formData.title}
              onChange={handleFormChange('title')}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Опис"
              value={formData.description}
              onChange={handleFormChange('description')}
              fullWidth
              multiline
              rows={3}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Кількість кредитів ECTS"
              type="number"
              value={formData.creditsEcts}
              onChange={handleFormChange('creditsEcts')}
              fullWidth
              inputProps={{ min: 1, max: 30 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Семестр"
              value={formData.semester}
              onChange={handleFormChange('semester')}
              fullWidth
              placeholder="напр. 2026-Spring"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Тип контролю</InputLabel>
              <Select
                value={formData.finalControl}
                onChange={handleFormChange('finalControl')}
                label="Тип контролю"
              >
                <MenuItem value="Exam">Екзамен</MenuItem>
                <MenuItem value="GradedPass">Диф. залік</MenuItem>
                <MenuItem value="Pass">Залік</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={formData.status}
                onChange={handleFormChange('status')}
                label="Статус"
              >
                <MenuItem value="Draft">Чернетка</MenuItem>
                <MenuItem value="Published">Опубліковано</MenuItem>
                <MenuItem value="Archived">В архіві</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between' }}>
            <Button
              onClick={() => {
                handleCloseForm()
                navigate(`/courses/${formDialog.id}/build`)
              }}
              startIcon={<BuildIcon />}
              disabled={formDialog === 'create'}
            >
              Конструктор
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={handleCloseForm}>Скасувати</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {formDialog === 'create' ? 'Створити' : 'Зберегти'}
              </Button>
            </Box>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

// ─── Student view ─────────────────────────────────────────────────────────────

const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'Всі курси' },
  { value: 'active', label: 'Активні' },
  { value: 'hidden', label: 'Приховані' },
]

function StudentCatalog() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('newest')
  const [visibilityFilter, setVisibilityFilter] = useState('all')

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['courses', { search: debouncedSearch, sort: sortBy }],
    queryFn: () =>
      getCourses({
        q: debouncedSearch,
        page: 1,
        pageSize: 100,
      }),
  })

  const enrollMutation = useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  })

  const hideMutation = useMutation({
    mutationFn: async (courseId) => {
      const res = await getEnrollments(courseId)
      const enrollments = res?.data?.data ?? res?.data ?? []
      const enrollment = enrollments[0]
      if (!enrollment) throw new Error('Enrollment not found')
      return hideEnrollment(enrollment.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  })

  const unhideMutation = useMutation({
    mutationFn: async (courseId) => {
      const res = await getEnrollments(courseId)
      const enrollments = res?.data?.data ?? res?.data ?? []
      const enrollment = enrollments[0]
      if (!enrollment) throw new Error('Enrollment not found')
      return unhideEnrollment(enrollment.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  })

  const allCourses = data?.data ?? []

  const sortedCourses = [...allCourses].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title, 'uk')
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt)
    }
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  const filteredCourses = sortedCourses.filter((course) => {
    const enrollment = course.myEnrollment
    if (visibilityFilter === 'active') {
      return enrollment === null || enrollment.hiddenByStudent === false
    }
    if (visibilityFilter === 'hidden') {
      return enrollment !== null && enrollment.hiddenByStudent === true
    }
    return true
  })

  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE)
  const paginatedCourses = filteredCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Каталог курсів</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          placeholder="Пошук курсів..."
          value={search}
          onChange={handleSearchChange}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Select
          value={visibilityFilter}
          onChange={(e) => { setVisibilityFilter(e.target.value); setPage(1) }}
          size="small"
          sx={{ minWidth: 140 }}
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </Select>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          size="small"
          sx={{ minWidth: 140 }}
        >
          {SORT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </Select>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      )}
      {isError && (
        <Alert severity="error">{error?.message ?? 'Помилка завантаження'}</Alert>
      )}
      {!isLoading && !isError && filteredCourses.length === 0 && (
        <Typography color="text.secondary" textAlign="center" mt={4}>Курсів не знайдено</Typography>
      )}

      <Grid container spacing={3}>
        {paginatedCourses.map((course) => {
          const myEnrollment = course.myEnrollment ?? null
          return (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CourseCardBody course={course} />

                <Divider />

                <CardActions>
                  <Button variant="text" size="small" onClick={() => navigate(`/courses/${course.id}`)}>
                    Переглянути
                  </Button>
                  {myEnrollment === null && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      disabled={enrollMutation.isPending}
                      onClick={() => enrollMutation.mutate(course.id)}
                    >
                      Записатися
                    </Button>
                  )}
                  {myEnrollment?.status === 'Pending' && (
                    <Button variant="text" size="small" disabled>
                      Очікує підтвердження
                    </Button>
                  )}
                  {myEnrollment?.status === 'Approved' && (
                    <Button variant="text" size="small" color="success" disabled>
                      Записаний
                    </Button>
                  )}
                  {myEnrollment !== null && myEnrollment.hiddenByStudent === false && (
                    <Tooltip title="Приховати курс">
                      <IconButton
                        size="small"
                        sx={{ marginLeft: 'auto' }}
                        disabled={hideMutation.isPending}
                        onClick={() => hideMutation.mutate(course.id)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {myEnrollment !== null && myEnrollment.hiddenByStudent === true && (
                    <Tooltip title="Відновити курс">
                      <IconButton
                        size="small"
                        sx={{ marginLeft: 'auto' }}
                        disabled={unhideMutation.isPending}
                        onClick={() => unhideMutation.mutate(course.id)}
                      >
                        <VisibilityOffIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}
    </Box>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function CourseCatalog() {
  const { user } = useAuth()
  if (user.role === 'Instructor') return <InstructorCatalog user={user} />
  return <StudentCatalog />
}

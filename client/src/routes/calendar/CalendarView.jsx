import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Checkbox, 
  FormControlLabel, 
  FormGroup, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton, 
  Stack, 
  useMediaQuery, 
  useTheme,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  ChevronLeft, 
  ChevronRight, 
  FilterList
} from '@mui/icons-material';
import apiClient from '../../api/client';
import { useAuth } from '../../auth/useAuth';

export default function CalendarView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCourses, setSelectedCourses] = useState({});
  const [activeEvent, setActiveEvent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const { data: eventsResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['calendarEvents', currentMonth, currentYear],
    queryFn: async () => {
      return {
        data: [
          {
            id: "ev-1",
            title: "Лабораторна робота №3: Валідація Prisma",
            description: "Необхідно завантажити архів з вихідним кодом сервера та файлом .env конфігурації. Перевіряється автоматичними тестами.",
            startDateTime: "2026-06-08T09:00:00Z",
            endDateTime: "2026-06-08T23:59:00Z",
            courseId: "course-web",
            course: { title: "Розробка Веб-додатків", colorCode: "#e91e63" }
          },
          {
            id: "ev-2",
            title: "Модульний контроль: Теорія алгоритмів",
            description: "Тестування в системі LMS. На виконання дається 45 хвилин та 1 спроба. Консультація в Discord о 12:00.",
            startDateTime: "2026-06-15T10:00:00Z",
            endDateTime: "2026-06-15T18:00:00Z",
            courseId: "course-algo",
            course: { title: "Алгоритми та структури даних", colorCode: "#9c27b0" }
          },
          {
            id: "ev-3",
            title: "Захист Курсового Проекту (ООП)",
            description: "Завантажити пояснювальну записку у форматі PDF, файл презентації та посилання на репозиторій GitHub.",
            startDateTime: "2026-06-22T09:00:00Z",
            endDateTime: "2026-06-22T14:00:00Z",
            courseId: "course-oop",
            course: { title: "Об'єктно-орієнтоване програмування", colorCode: "#2196f3" }
          },
          {
            id: "ev-4",
            title: "Курс-лекція: Оптимізація React Query",
            description: "Додатковий вебінар по роботі з кешуванням та мутаціями станів у великих проектах.",
            startDateTime: "2026-06-18T15:00:00Z",
            endDateTime: "2026-06-18T16:30:00Z",
            courseId: "course-web",
            course: { title: "Розробка Веб-додатків", colorCode: "#e91e63" }
          }
        ]
      };
    },
    keepPreviousData: true
  });

  useEffect(() => {
    if (eventsResponse?.data) {
      const courses = {};
      eventsResponse.data.forEach(event => {
        if (event.course && !courses[event.courseId]) {
          courses[event.courseId] = {
            title: event.course.title,
            color: event.course.colorCode || '#1976d2',
            checked: true
          };
        }
      });
      setSelectedCourses(prev => ({ ...courses, ...prev }));
    }
  }, [eventsResponse]);

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, newDate }) => {
      return await apiClient.patch(`/calendar/events/${eventId}`, { endDateTime: newDate.toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarEvents']);
      setSnackbar({ open: true, message: 'Дедлайн успішно оновлено!', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Помилка оновлення дедлайну на сервері.', severity: 'error' });
    }
  });

  const handleFilterChange = (courseId) => {
    setSelectedCourses(prev => ({
      ...prev,
      [courseId]: { ...prev[courseId], checked: !prev[courseId].checked }
    }));
  };

  const filteredEvents = eventsResponse?.data?.filter(event => {
    return selectedCourses[event.courseId]?.checked !== false;
  }) || [];

  const handleExportICal = () => {
    if (filteredEvents.length === 0) {
      setSnackbar({ open: true, message: 'Немає подій для експорту', severity: 'warning' });
      return;
    }

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//University LMS//Calendar Module//UK',
      'CALSCALE:GREGORIAN'
    ];

    filteredEvents.forEach(event => {
      const cleanDate = (isoString) => isoString.replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@lms.university`,
        `DTSTAMP:${cleanDate(new Date().toISOString())}`,
        `DTSTART:${cleanDate(event.startDateTime || event.endDateTime)}`,
        `DTEND:${cleanDate(event.endDateTime)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || 'Дедлайн курсу'}`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `lms_calendar_${currentMonth + 1}_2026.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSnackbar({ open: true, message: 'Файл calendar.ics завантажено!', severity: 'info' });
  };

  const handleDragStart = (e, eventId) => {
    if (user?.role !== 'Instructor') return;
    e.dataTransfer.setData('text/plain', eventId);
  };

  const handleDrop = (e, dayIndex) => {
    e.preventDefault();
    if (user?.role !== 'Instructor') return;
    const eventId = e.dataTransfer.getData('text/plain');
    const targetDate = new Date(currentYear, currentMonth, dayIndex);
    
    const originalEvent = filteredEvents.find(ev => ev.id === eventId);
    if (originalEvent) {
      const newDeadline = new Date(originalEvent.endDateTime);
      newDeadline.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      updateEventMutation.mutate({ eventId, newDate: newDeadline });
    }
  };

  const renderDesktopGrid = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const gridCells = [];
    for (let i = 0; i < offset; i++) {
      gridCells.push(<Grid item xs={1} key={`empty-${i}`} sx={{ border: '1px solid #e0e0e0', height: 140, bgcolor: '#fafafa' }} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(currentYear, currentMonth, day).toDateString();
      const dayEvents = filteredEvents.filter(ev => new Date(ev.endDateTime).toDateString() === dateStr);

      gridCells.push(
        <Grid 
          item 
          xs={1} 
          key={`day-${day}`} 
          onDragOver={(e) => user?.role === 'Instructor' && e.preventDefault()}
          onDrop={(e) => handleDrop(e, day)}
          sx={{ 
            border: '1px solid #e0e0e0', 
            height: 140, 
            position: 'relative',
            p: 0.5,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: '#fcfcfc' }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>{day}</Typography>
          <Stack spacing={0.5} sx={{ overflowY: 'auto', maxHeight: 100 }}>
            {dayEvents.map(ev => (
              <Box
                key={ev.id}
                draggable={user?.role === 'Instructor'}
                onDragStart={(e) => handleDragStart(e, ev.id)}
                onClick={() => setActiveEvent(ev)}
                sx={{
                  bgcolor: selectedCourses[ev.courseId]?.color || '#1976d2',
                  color: 'white',
                  borderRadius: 1,
                  p: 0.5,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  boxShadow: 1,
                  '&:hover': { opacity: 0.9 }
                }}
              >
                {ev.title}
              </Box>
            ))}
          </Stack>
        </Grid>
      );
    }

    return gridCells;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Календар дедлайнів
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Поточна роль: <strong>{user?.role === 'Instructor' ? 'Викладач' : 'Студент'}</strong>
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportICal}>
            Експорт в iCal
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 150, textTransform: 'capitalize', textAlign: 'center', fontWeight: 'bold' }}>
              {currentDate.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
            </Typography>
            <IconButton onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}>
              <ChevronRight />
            </IconButton>
          </Stack>
          {isMobile && <FilterList color="primary" />}
        </Stack>
      </Card>

      <Grid container spacing={3}>
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Фільтр за дисциплінами
                </Typography>
                <FormGroup>
                  {Object.keys(selectedCourses).map(courseId => (
                    <FormControlLabel
                      key={courseId}
                      control={
                        <Checkbox 
                          checked={selectedCourses[courseId].checked} 
                          onChange={() => handleFilterChange(courseId)}
                          sx={{
                            color: selectedCourses[courseId].color,
                            '&.Mui-checked': { color: selectedCourses[courseId].color },
                          }}
                        />
                      }
                      label={selectedCourses[courseId].title}
                    />
                  ))}
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={9}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={300}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Alert severity="error" action={<Button color="inherit" onClick={() => refetch()}>Повторити</Button>}>
              Помилка завантаження даних дедлайнів з сервера LMS.
            </Alert>
          ) : isMobile ? (
            <Stack spacing={2}>
              {filteredEvents.length === 0 ? (
                <Typography variant="body1" align="center" color="text.secondary">Подій на цей місяць не виявлено.</Typography>
              ) : (
                filteredEvents.map(ev => (
                  <Card 
                    key={ev.id} 
                    onClick={() => setActiveEvent(ev)} 
                    sx={{ borderLeft: `6px solid ${selectedCourses[ev.courseId]?.color || '#1976d2'}`, cursor: 'pointer' }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(ev.endDateTime).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>{ev.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedCourses[ev.courseId]?.title}</Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          ) : (
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 2 }}>
              <Grid container columns={7} sx={{ textAlign: 'center', fontWeight: 'bold', mb: 1 }}>
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
                  <Grid item xs={1} key={d}><Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{d}</Typography></Grid>
                ))}
              </Grid>
              <Grid container columns={7}>
                {renderDesktopGrid()}
              </Grid>
            </Box>
          )}
        </Grid>
      </Grid>

      <Dialog open={Boolean(activeEvent)} onClose={() => setActiveEvent(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
          Деталі навчального дедлайну
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {activeEvent && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>{activeEvent.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Дисципліна:</strong> {selectedCourses[activeEvent.courseId]?.title}
              </Typography>
              <Typography variant="body2">
                <strong>Кінцевий термін здачі:</strong> {new Date(activeEvent.endDateTime).toLocaleString('uk-UA')}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                {activeEvent.description || 'Опис та критерії оцінювання завдання відсутні.'}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActiveEvent(null)}>Закрити</Button>
          <Button variant="contained" color="primary">Перейти до виконання</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
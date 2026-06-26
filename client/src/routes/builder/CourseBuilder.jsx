import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, IconButton, Tooltip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { SectionCard } from './components/SectionCard.jsx'
import { ItemDialog } from './components/ItemDialog.jsx'
import { useCourseBuilderData } from './hooks/useCourseBuilderData.jsx'

export function CourseBuilder() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor)
  )

  const customCollisionDetection = (args) => {
    const { active, droppableContainers } = args
    if (!active) return []

    const activeId = String(active.id)
    const isActiveSection = activeId.startsWith('section-')
    const isActiveLesson = activeId.startsWith('lesson-')

    const filteredContainers = droppableContainers.filter((container) => {
      const containerId = String(container.id)
      if (isActiveSection) {
        return containerId.startsWith('section-')
      }
      if (isActiveLesson) {
        return containerId.startsWith('lesson-')
      }
      return true
    })

    return closestCenter({
      ...args,
      droppableContainers: filteredContainers
    })
  }

  // --- Data Hook ---
  const { 
    isLoading, course, sectionsData, lessonsData, assignmentsData, 
    handleDragEnd, mutations 
  } = useCourseBuilderData(courseId)

  // --- State for Modals ---
  const [dialogState, setDialogState] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [expandedSection, setExpandedSection] = useState(null)

  if (isLoading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
  if (!sectionsData) return <Alert severity="error">Помилка завантаження даних курсу</Alert>

  const sections = sectionsData || []
  const lessons = lessonsData?.data || []
  const assignments = assignmentsData?.data || []

  // --- Form Handlers ---
  const handleSaveItem = (formData) => {
    const { type, action, data, sectionId } = dialogState
    
    if (type === 'section') {
      if (action === 'create') mutations.createSecMut.mutate(formData)
      else mutations.updateSecMut.mutate({ id: data.id, ...formData })
    } else if (type === 'lesson') {
      const payload = {
        title: formData.title,
        contentMarkdown: data?.contentMarkdown || 'Вміст лекції...',
        releaseAt: formData.releaseAt || null
      }
      if (action === 'create') mutations.createLessMut.mutate({ sectionId, data: payload })
    } else if (type === 'assignment') {
      const payload = {
        title: formData.title,
        descriptionMarkdown: formData.descriptionMarkdown || 'Опис завдання...',
        dueAt: formData.dueAt,
        releaseAt: formData.releaseAt || null,
        maxScore: Number(formData.maxScore) || 100
      }
      if (action === 'create') mutations.createAssMut.mutate({ sectionId, data: payload })
      else mutations.updateAssMut.mutate({ id: data.id, ...payload })
    }
    setDialogState(null)
  }

  const handleDelete = () => {
    const { type, id } = deleteDialog
    if (type === 'section') mutations.deleteSecMut.mutate(id)
    else if (type === 'lesson') mutations.deleteLessMut.mutate(id)
    else if (type === 'assignment') mutations.deleteAssMut.mutate(id)
    setDeleteDialog(null)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Tooltip title="Назад">
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" fontWeight={700} sx={{ flexGrow: 1 }}>
          Конструктор: {course?.title || 'Курс'}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setDialogState({ type: 'section', action: 'create' })}
        >
          Новий розділ
        </Button>
      </Box>

      <DndContext sensors={sensors} collisionDetection={customCollisionDetection} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => `section-${s.id}`)} strategy={verticalListSortingStrategy}>
          <div>
            {sections.map((section, index) => (
              <SectionCard 
                key={section.id}
                section={section}
                index={index}
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
                lessons={lessons}
                assignments={assignments}
                onAddLesson={(secId) => setDialogState({ type: 'lesson', action: 'create', sectionId: secId })}
                onAddAssignment={(secId) => setDialogState({ type: 'assignment', action: 'create', sectionId: secId })}
                onEditSection={(sec) => setDialogState({ type: 'section', action: 'edit', data: sec })}
                onDeleteSection={(sec) => setDeleteDialog({ type: 'section', id: sec.id, title: sec.title })}
                onDeleteLesson={(less) => setDeleteDialog({ type: 'lesson', id: less.id, title: less.title })}
                onEditAssignment={(ass, secId) => setDialogState({ type: 'assignment', action: 'edit', data: ass, sectionId: secId })}
                onDeleteAssignment={(ass) => setDeleteDialog({ type: 'assignment', id: ass.id, title: ass.title })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ItemDialog open={Boolean(dialogState)} state={dialogState} onClose={() => setDialogState(null)} onSave={handleSaveItem} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteDialog)} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>Ви впевнені, що хочете видалити «{deleteDialog?.title}»? Цю дію неможливо скасувати.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Скасувати</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Видалити</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

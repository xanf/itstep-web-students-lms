import React, { useState } from 'react'
import {
  Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material'
import dayjs from 'dayjs'

export function ItemDialog({ open, state, onClose, onSave }) {
  if (!state) return null
  const { type, action, data } = state
  
  const [formData, setFormData] = useState(() => {
    if (action === 'create') {
      if (type === 'section') return { title: '' }
      if (type === 'lesson') return { title: '', releaseAt: '' }
      if (type === 'assignment') return { title: '', descriptionMarkdown: '', dueAt: dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm'), releaseAt: '', maxScore: 100 }
    }
    const dt = { ...data }
    if (dt.releaseAt) dt.releaseAt = dayjs(dt.releaseAt).format('YYYY-MM-DDTHH:mm')
    if (dt.dueAt) dt.dueAt = dayjs(dt.dueAt).format('YYYY-MM-DDTHH:mm')
    return dt
  })

  const handleChange = (f) => (e) => setFormData(p => ({ ...p, [f]: e.target.value }))
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); }

  const titles = {
    section: action === 'create' ? 'Новий розділ' : 'Редагувати розділ',
    lesson: action === 'create' ? 'Нова лекція' : 'Редагувати лекцію',
    assignment: action === 'create' ? 'Нове завдання' : 'Налаштування завдання',
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{titles[type]}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Назва" value={formData.title} onChange={handleChange('title')} required fullWidth />
          
          {(type === 'lesson' || type === 'assignment') && (
            <TextField
              label="Дата публікації (опціонально)" type="datetime-local" value={formData.releaseAt || ''}
              onChange={handleChange('releaseAt')} fullWidth InputLabelProps={{ shrink: true }}
              helperText="Залиште порожнім, щоб зробити доступним одразу"
            />
          )}

          {type === 'assignment' && (
            <>
              <TextField
                label="Опис (Markdown)" value={formData.descriptionMarkdown || ''} onChange={handleChange('descriptionMarkdown')}
                fullWidth multiline rows={4}
              />
              <TextField
                label="Дедлайн" type="datetime-local" value={formData.dueAt || ''}
                onChange={handleChange('dueAt')} required fullWidth InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Максимальний бал" type="number" value={formData.maxScore || ''}
                onChange={handleChange('maxScore')} required fullWidth inputProps={{ min: 1 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Скасувати</Button>
          <Button type="submit" variant="contained">Зберегти</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

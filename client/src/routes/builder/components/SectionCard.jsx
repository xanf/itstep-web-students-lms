import {
  Card, Accordion, AccordionSummary, AccordionDetails,
  Box, Typography, IconButton, Tooltip, List
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Article as ArticleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LessonItem } from './LessonItem.jsx'
import { AssignmentItem } from './AssignmentItem.jsx'

export function SectionCard({
  section, index,
  expandedSection, setExpandedSection,
  lessons, assignments,
  onAddLesson, onAddAssignment, onEditSection, onDeleteSection,
  onDeleteLesson, onEditAssignment, onDeleteAssignment
}) {
  const sectionLessons = lessons.filter(l => l.sectionId === section.id).sort((a, b) => a.order - b.order)
  const sectionAssignments = assignments.filter(a => a.sectionId === section.id).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `section-${section.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    marginBottom: '16px',
    opacity: isDragging ? 0.6 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <Card
        style={{
          ...(isDragging ? { boxShadow: '0 8px 16px rgba(0,0,0,0.1)' } : {})
        }}
      >
          <Accordion
            expanded={expandedSection === section.id}
            onChange={(e, exp) => setExpandedSection(exp ? section.id : null)}
            disableGutters
            sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <Box {...listeners} sx={{ mr: 2, display: 'flex', color: 'text.secondary', cursor: 'grab' }}>
                  <DragIndicatorIcon />
                </Box>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {index + 1}. {section.title}
                </Typography>
                <Box>
                  <Tooltip title="Додати лекцію">
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation(); setExpandedSection(section.id); onAddLesson(section.id);
                    }}>
                      <ArticleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Додати завдання">
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation(); setExpandedSection(section.id); onAddAssignment(section.id);
                    }}>
                      <AssignmentIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Редагувати розділ">
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation(); onEditSection(section);
                    }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Видалити розділ">
                    <IconButton size="small" color="error" onClick={(e) => {
                      e.stopPropagation(); onDeleteSection(section);
                    }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: 'grey.50', pt: 0, pb: 2 }}>
              {/* Lessons Droppable Zone */}
              <SortableContext items={sectionLessons.map(l => `lesson-${l.id}`)} strategy={verticalListSortingStrategy}>
                <div>
                  {sectionLessons.map((lesson, lIndex) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      index={lIndex}
                      onDelete={onDeleteLesson}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Assignments List (Not draggable) */}
              <List sx={{ p: 0 }}>
                {sectionAssignments.map(assignment => (
                  <AssignmentItem
                    key={assignment.id}
                    assignment={assignment}
                    sectionId={section.id}
                    onEdit={onEditAssignment}
                    onDelete={onDeleteAssignment}
                  />
                ))}
              </List>

              {sectionLessons.length === 0 && sectionAssignments.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Розділ порожній. Додайте лекції або завдання.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
          </Card>
        </div>
  )
}

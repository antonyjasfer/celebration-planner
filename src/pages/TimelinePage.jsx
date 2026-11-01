import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Clock, CheckCircle2, AlertCircle,
  Plus, RefreshCw, Filter, Flag, Square
} from 'lucide-react';
import { updateEvent, toggleTask, formatDate, daysUntil, formatCurrency } from '../services/eventStore';
import { generateTimeline } from '../services/gemini';
import { sanitizeInput } from '../utils/sanitize';
import { useModalEscape } from '../hooks/useModalEscape';
import './TimelinePage.css';

/**
 * Event Roadmap & Timeline Page.
 * Visualizes 4 chronological phases, interactive task completion,
 * milestone deadlines, priority filters, and custom task creation.
 *
 * @param {Object} props
 * @param {Object} props.event - Active event record
 * @param {function(string, string=): void} props.showToast - Toast notification dispatcher
 */
export default function TimelinePage({ event, showToast }) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('high');
  const [newTaskCategory, setNewTaskCategory] = useState('general');
  const [newTaskPhase, setNewTaskPhase] = useState(0);

  // Keyboard accessibility for modal
  useModalEscape(showAddTaskModal, () => setShowAddTaskModal(false));

  const timelineData = event.timeline || {
    eventDate: event.eventDate,
    totalDaysRemaining: daysUntil(event.eventDate),
    phases: [],
    milestones: [],
    urgentActions: []
  };

  const completedTaskIds = event.completedTasks || [];
  const allTasks = (timelineData.phases || []).flatMap(p => p.tasks || []);
  const totalTasksCount = allTasks.length;
  const completedTasksCount = completedTaskIds.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const daysLeft = daysUntil(event.eventDate);

  const handleTaskToggle = (taskId) => {
    toggleTask(event.id, taskId);
    showToast('Task status updated', 'info');
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const freshTimeline = await generateTimeline(event);
      updateEvent(event.id, { timeline: freshTimeline });
      showToast('Timeline regenerated with updated milestones!', 'success');
    } catch (err) {
      console.error('Timeline regeneration error:', err);
      showToast('Could not regenerate timeline.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    const cleanTitle = sanitizeInput(newTaskTitle.trim());
    if (!cleanTitle) return;

    const newTask = {
      id: `task-custom-${Date.now()}`,
      title: cleanTitle,
      description: sanitizeInput(newTaskDesc.trim()),
      deadline: newTaskDeadline || event.eventDate,
      priority: sanitizeInput(newTaskPriority),
      category: sanitizeInput(newTaskCategory),
      dependsOn: [],
      estimatedCost: 0,
      completed: false,
    };

    const updatedPhases = [...(timelineData.phases || [])];
    if (updatedPhases[newTaskPhase]) {
      updatedPhases[newTaskPhase] = {
        ...updatedPhases[newTaskPhase],
        tasks: [...(updatedPhases[newTaskPhase].tasks || []), newTask]
      };
    } else {
      updatedPhases.push({
        name: 'Custom Tasks',
        startDate: '',
        endDate: '',
        status: 'current',
        tasks: [newTask]
      });
    }

    updateEvent(event.id, {
      timeline: {
        ...timelineData,
        phases: updatedPhases
      }
    });

    showToast(`Task "${cleanTitle}" created!`, 'success');
    setShowAddTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskDeadline('');
  };

  return (
    <div className="timeline-page animate-fade-in" id="timeline-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Roadmap & Timeline</h1>
          <p className="page-subtitle">
            Target Date: <strong>{formatDate(event.eventDate)}</strong> ({daysLeft} days remaining)
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            id="btn-regenerate-timeline"
          >
            <RefreshCw className={isRegenerating ? 'spin-icon' : ''} size={16} aria-hidden="true" />
            {isRegenerating ? 'Recalculating...' : 'Regenerate Timeline'}
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowAddTaskModal(true)}
            id="btn-add-custom-task"
          >
            <Plus size={16} aria-hidden="true" /> Add Custom Task
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="timeline-overview-card glass-card">
        <div className="overview-metric">
          <span className="overview-label">Tasks Finished</span>
          <span className="overview-val">{completedTasksCount} / {totalTasksCount}</span>
        </div>
        <div className="overview-track">
          <div className="overview-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="overview-pct">{progressPercent}% Ready</span>
      </div>

      {/* Milestones Horizontal Bar */}
      {timelineData.milestones?.length > 0 && (
        <div className="milestones-section">
          <h2 className="section-title">Major Milestones</h2>
          <div className="milestones-track">
            {timelineData.milestones.map((m, idx) => (
              <div key={idx} className="milestone-node glass-card">
                <div className="milestone-badge">
                  <Flag size={14} className="text-secondary" aria-hidden="true" />
                  <span>{formatDate(m.date)}</span>
                </div>
                <h4 className="milestone-title">{m.title}</h4>
                <p className="milestone-desc">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Urgent Actions Alert */}
      {timelineData.urgentActions?.length > 0 && (
        <div className="urgent-actions-card glass-card">
          <div className="urgent-header">
            <AlertCircle className="text-warning" size={18} aria-hidden="true" />
            <h3>Urgent Actions for this Week</h3>
          </div>
          <div className="urgent-items-list">
            {timelineData.urgentActions.map((action, idx) => (
              <div key={idx} className="urgent-item-chip">
                <span>⚡ {action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <span className="filter-label"><Filter size={14} aria-hidden="true" /> Status:</span>
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </button>
        </div>

        <div className="filter-group">
          <span className="filter-label">Priority:</span>
          <button
            className={`filter-btn ${filterPriority === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPriority('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterPriority === 'critical' ? 'active' : ''}`}
            onClick={() => setFilterPriority('critical')}
          >
            Critical
          </button>
          <button
            className={`filter-btn ${filterPriority === 'high' ? 'active' : ''}`}
            onClick={() => setFilterPriority('high')}
          >
            High
          </button>
        </div>
      </div>

      {/* Phases with Tasks */}
      <div className="phases-container">
        {(timelineData.phases || []).map((phase, phaseIdx) => {
          const visibleTasks = (phase.tasks || []).filter(task => {
            const isDone = completedTaskIds.includes(task.id);
            if (filterStatus === 'pending' && isDone) return false;
            if (filterStatus === 'completed' && !isDone) return false;
            if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
            return true;
          });

          return (
            <div key={phaseIdx} className="phase-block glass-card">
              <div className="phase-header">
                <div className="phase-title-group">
                  <span className={`phase-status-pill status-${phase.status}`}>{phase.status}</span>
                  <h3 className="phase-title">{phase.name}</h3>
                </div>
                {phase.startDate && phase.endDate && (
                  <span className="phase-dates">
                    {formatDate(phase.startDate)} – {formatDate(phase.endDate)}
                  </span>
                )}
              </div>

              <div className="phase-tasks-list">
                {visibleTasks.length === 0 ? (
                  <p className="empty-phase-notice">No tasks match current filter in this phase.</p>
                ) : (
                  visibleTasks.map(task => {
                    const isCompleted = completedTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`task-card ${isCompleted ? 'task-card-completed' : ''}`}
                        onClick={() => handleTaskToggle(task.id)}
                      >
                        <button
                          type="button"
                          className="task-toggle-btn"
                          aria-label={isCompleted ? `Mark task ${task.title} incomplete` : `Mark task ${task.title} complete`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={20} className="text-success" aria-hidden="true" />
                          ) : (
                            <Square size={20} className="text-tertiary" aria-hidden="true" />
                          )}
                        </button>

                        <div className="task-content">
                          <div className="task-main-row">
                            <h4 className="task-heading">{task.title}</h4>
                            <span className={`priority-tag priority-${task.priority}`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="task-desc">{task.description}</p>
                          )}

                          <div className="task-footer-tags">
                            {task.deadline && (
                              <span className="task-tag deadline-tag">
                                <Clock size={12} aria-hidden="true" /> {formatDate(task.deadline)}
                              </span>
                            )}
                            {task.category && (
                              <span className="task-tag cat-tag">
                                {task.category}
                              </span>
                            )}
                            {task.dependsOn?.length > 0 && (
                              <span className="task-tag dep-tag">
                                Depends on: {task.dependsOn.join(', ')}
                              </span>
                            )}
                            {task.estimatedCost > 0 && (
                              <span className="task-tag cost-tag">
                                Est: {formatCurrency(task.estimatedCost)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Task Modal */}
      {showAddTaskModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-task-modal-title"
        >
          <div className="modal-backdrop" onClick={() => setShowAddTaskModal(false)} aria-hidden="true" />
          <div className="modal-content glass-card task-modal-box">
            <div className="modal-header">
              <h3 className="modal-title" id="add-task-modal-title">Create Custom Milestone Task</h3>
              <button className="modal-close" onClick={() => setShowAddTaskModal(false)} aria-label="Close modal">✕</button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-title-input">Task Title</label>
                <input
                  id="task-title-input"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g., Finalize DJ must-play playlist"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-desc-input">Description / Action Steps</label>
                <textarea
                  id="task-desc-input"
                  className="form-input"
                  rows={2}
                  placeholder="Brief details or who to contact..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-deadline-input">Deadline Date</label>
                  <input
                    id="task-deadline-input"
                    type="date"
                    className="form-input"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-priority-select">Priority</label>
                  <select
                    id="task-priority-select"
                    className="form-input"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-category-select">Category</label>
                  <select
                    id="task-category-select"
                    className="form-input"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                  >
                    <option value="venue">Venue</option>
                    <option value="catering">Catering</option>
                    <option value="decoration">Decoration</option>
                    <option value="photography">Photography</option>
                    <option value="guest">Guest Management</option>
                    <option value="general">General / Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-phase-select">Phase Placement</label>
                  <select
                    id="task-phase-select"
                    className="form-input"
                    value={newTaskPhase}
                    onChange={(e) => setNewTaskPhase(Number(e.target.value))}
                  >
                    {(timelineData.phases || []).map((p, i) => (
                      <option key={i} value={i}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-primary">Add Task</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddTaskModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

TimelinePage.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    eventDate: PropTypes.string,
    timeline: PropTypes.object,
    completedTasks: PropTypes.array,
  }).isRequired,
  showToast: PropTypes.func.isRequired,
};

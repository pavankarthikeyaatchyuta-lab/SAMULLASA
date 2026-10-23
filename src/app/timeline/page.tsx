'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, Button, Input, Select, Badge, Modal, EmptyState } from '@/components/ui';
import type { Task, TaskPriority, TaskStatus } from '@/types/events';
import { buildDependencyGraph, detectCycles } from '@/lib/constraint-engine';

export default function TimelinePage() {
  const { state, dispatch, getCurrentScenario } = useStore();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    state.events[0]?.id || '',
  );

  const activeEvent = state.events.find((e) => e.id === selectedEventId) || state.events[0];
  const activeScenario = activeEvent ? getCurrentScenario(activeEvent.id) : undefined;

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [selectedDep, setSelectedDep] = useState<string>('');

  // Dependency graph and cycle check
  const graph = activeScenario ? buildDependencyGraph(activeScenario.tasks) : new Map();
  const cycles = activeScenario ? detectCycles(graph) : [];

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setOwner('');
    setDueDate(activeEvent?.date || new Date().toISOString().slice(0, 10));
    setPriority('high');
    setStatus('pending');
    setSelectedDep('');
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setOwner(task.owner || '');
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setStatus(task.status);
    setSelectedDep(task.dependencies[0] || '');
    setModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScenario) return;

    const deps = selectedDep ? [selectedDep] : [];

    if (editingTask) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          scenarioId: activeScenario.id,
          taskId: editingTask.id,
          updates: {
            title,
            description,
            owner,
            dueDate,
            priority,
            status,
            dependencies: deps,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        description,
        owner,
        dueDate,
        priority,
        status,
        dependencies: deps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({
        type: 'ADD_TASK',
        payload: {
          scenarioId: activeScenario.id,
          task: newTask,
        },
      });
    }

    setModalOpen(false);
  };

  const handleToggleComplete = (task: Task) => {
    if (!activeScenario) return;
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        scenarioId: activeScenario.id,
        taskId: task.id,
        updates: {
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!activeScenario) return;
    if (confirm('Delete this task?')) {
      dispatch({
        type: 'REMOVE_TASK',
        payload: {
          scenarioId: activeScenario.id,
          taskId,
        },
      });
    }
  };

  if (!activeEvent || !activeScenario) {
    return (
      <EmptyState
        title="No Event Selected"
        description="Please create or load an event to access the preparation timeline."
        action={
          <Button onClick={() => dispatch({ type: 'LOAD_SAMPLE_DATA' })} variant="primary">
            Load Sample Event
          </Button>
        }
      />
    );
  }

  // Sort tasks chronologically by due date
  const sortedTasks = [...activeScenario.tasks].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );

  const filteredTasks = sortedTasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Preparation Timeline</h1>
          <p className="text-sm text-[var(--muted)]">
            Actionable, date-aware task milestones with dependency tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          {state.events.length > 1 && (
            <select
              value={activeEvent.id}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] text-[var(--foreground)]"
            >
              {state.events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          )}

          <Button onClick={handleOpenAdd} variant="primary" size="sm">
            + Add Milestone / Task
          </Button>
        </div>
      </div>

      {/* Cycle alert if detected */}
      {cycles.length > 0 && (
        <div className="p-4 bg-[var(--danger-bg)] text-[var(--danger)] rounded-[var(--radius-md)] text-sm font-medium" role="alert">
          ⚠ Circular dependency detected between tasks! Cycles: {cycles.map((c) => c.join(' → ')).join('; ')}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--muted)]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
          >
            <option value="all">All Statuses ({activeScenario.tasks.length})</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--muted)]">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No Milestones Found"
            description="No tasks match your selected filter criteria. Add your first task or change filter."
            action={
              <Button onClick={handleOpenAdd} variant="primary" size="sm">
                + Create Task
              </Button>
            }
          />
        ) : (
          filteredTasks.map((task) => {
            const hasDependency = task.dependencies.length > 0;
            const parentTask = hasDependency
              ? activeScenario.tasks.find((t) => t.id === task.dependencies[0])
              : null;
            const isParentIncomplete = parentTask && parentTask.status !== 'completed';

            return (
              <Card
                key={task.id}
                padding="md"
                className={`transition-all border-l-4 ${
                  task.status === 'completed'
                    ? 'border-l-[var(--success)] opacity-80'
                    : task.priority === 'critical'
                    ? 'border-l-[var(--danger)]'
                    : isParentIncomplete
                    ? 'border-l-[var(--warning)]'
                    : 'border-l-[var(--primary)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border text-xs font-bold transition-colors ${
                        task.status === 'completed'
                          ? 'bg-[var(--success)] text-white border-[var(--success)]'
                          : 'border-[var(--muted-foreground)] hover:border-[var(--primary)]'
                      }`}
                      aria-label={`Mark task ${task.title} as ${task.status === 'completed' ? 'incomplete' : 'completed'}`}
                    >
                      {task.status === 'completed' ? '✓' : ''}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-base font-semibold ${task.status === 'completed' ? 'line-through text-[var(--muted)]' : 'text-[var(--foreground)]'}`}>
                          {task.title}
                        </span>
                        <Badge
                          variant={
                            task.priority === 'critical'
                              ? 'danger'
                              : task.priority === 'high'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {task.priority.toUpperCase()}
                        </Badge>
                        {isParentIncomplete && (
                          <Badge variant="warning">
                            Blocked by &ldquo;{parentTask?.title}&rdquo;
                          </Badge>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-[var(--muted)] mt-1">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)] mt-2">
                        <span>📅 Due: <strong className="text-[var(--foreground)]">{task.dueDate}</strong></span>
                        {task.owner && <span>👤 Owner: {task.owner}</span>}
                        {parentTask && (
                          <span>🔗 Depends on: <em>{parentTask.title}</em></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(task)}
                    >
                      Edit
                    </Button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-xs text-[var(--danger)] hover:underline p-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Task Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Milestone / Task' : 'Add Preparation Milestone'}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Input
            label="Milestone Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Confirm wedding mandap florist"
            required
          />

          <Input
            label="Target Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              options={[
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'blocked', label: 'Blocked' },
              ]}
            />
          </div>

          <Input
            label="Responsible Owner / Role"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="e.g. Vikram / Bride's Sister / Planner"
          />

          <Select
            label="Dependency (Must be completed before this task)"
            value={selectedDep}
            onChange={(e) => setSelectedDep(e.target.value)}
            placeholder="None (Independent task)"
            options={activeScenario.tasks
              .filter((t) => !editingTask || t.id !== editingTask.id)
              .map((t) => ({ value: t.id, label: `${t.title} (${t.dueDate})` }))}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? 'Update Milestone' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useRef } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import { addTask, updateTask, toggleTask, removeTask, selectTasks, getTaskStats } from './domain/task-service.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';

export default function App() {
  const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);
  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask = tasks.find(task => task.id === editingId) ?? null;
  const nextId = useRef(Math.max(0, ...initialTasks.map(task => task.id)) + 1);

  function save(value) {
    if (editingId === null) {
      const id = nextId.current++;
      setTasks(previous => addTask(previous, value, id));
    } else {
      if (!editingTask) return false;
      setTasks(previous => updateTask(previous, editingId, value));
      setEditingId(null);
    }
    return true;
  }

  function remove(id) {
    const task = tasks.find(item => item.id === id);
    if (!task || !window.confirm(`Удалить «${task.title}»?`)) return;
    setTasks(previous => removeTask(previous, id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>Практическая работа № 7 · данные в памяти страницы</p>
      <TaskStats stats={stats} />
      <TaskFilters filters={filters} categories={categories} onChange={setFilters} />
      <TaskList tasks={visibleTasks} categories={categories}
        onToggle={id => setTasks(previous => toggleTask(previous, id))}
        onEdit={setEditingId} onDelete={remove} />
      <TaskForm key={editingId ?? 'new'} categories={categories} initialTask={editingTask}
        onSave={save} onCancel={() => setEditingId(null)} />
    </main>
  );
}

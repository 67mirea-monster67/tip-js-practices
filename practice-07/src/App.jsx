import { useState } from 'react';
import { tasks as seedTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import { addTask, updateTask, toggleTask, removeTask, selectTasks, getTaskStats } from './domain/task-service.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';
export default function App() {
  const [tasks, setTasks] = useState(() => seedTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);
  const [nextId, setNextId] = useState(() => Math.max(...seedTasks.map(task => task.id)) + 1);
  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask = tasks.find(task => task.id === editingId) ?? null;
  function saveTask(value) {
    if (editingId === null) {
      setTasks(previous => addTask(previous, value, nextId));
      setNextId(previous => previous + 1);
    } else {
      if (!editingTask) return false;
      setTasks(previous => updateTask(previous, editingId, value));
      setEditingId(null);
    }
    return true;
  }
  function deleteTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task || !window.confirm(`Удалить задачу «${task.title}»?`)) return;
    setTasks(previous => removeTask(previous, id));
    if (editingId === id) setEditingId(null);
  }
  return <main>
    <header><p className="eyebrow">ПРАКТИЧЕСКАЯ РАБОТА 7</p><h1>Задачи на React</h1>
      <p>Сидлецкий Павел · ЭФБО-06-25 · вариант 1</p>
      <p>Данные в памяти страницы. Перезагрузка восстанавливает исходный набор.</p></header>
    <TaskStats stats={stats} />
    <TaskFilters filters={filters} categories={categories} onChange={setFilters} />
    <div className="workspace">
      <TaskList tasks={visibleTasks} categories={categories}
        onToggle={id => setTasks(previous => toggleTask(previous, id))}
        onEdit={setEditingId} onDelete={deleteTask} />
      <TaskForm key={editingId ?? 'new'} categories={categories} initialTask={editingTask}
        onSave={saveTask} onCancel={() => setEditingId(null)} />
    </div>
  </main>;
}

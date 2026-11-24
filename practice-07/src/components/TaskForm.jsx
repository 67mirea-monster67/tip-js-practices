import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';

export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const emptyDraft = { title: '', priority: 'medium', categoryId: '' };
  const [draft, setDraft] = useState(() => initialTask ? {
    title: initialTask.title, priority: initialTask.priority, categoryId: String(initialTask.categoryId),
  } : emptyDraft);
  const [errors, setErrors] = useState({});
  const update = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));

  function submit(event) {
    event.preventDefault();
    const result = validateTaskDraft(draft, categories);
    setErrors(result.errors);
    if (!result.valid) return;
    if (!onSave(result.value)) {
      setErrors({ form: 'Сохранить задачу не удалось.' });
      return;
    }
    if (!initialTask) setDraft(emptyDraft);
  }

  return <section aria-label="Форма задачи">
    <h2>{initialTask ? 'Редактирование задачи' : 'Новая задача'}</h2>
    <form onSubmit={submit} noValidate>
      <label>Название<input value={draft.title} required onChange={event => update('title', event.target.value)} /></label>
      {errors.title && <p role="alert">{errors.title}</p>}
      <label>Приоритет<select value={draft.priority} onChange={event => update('priority', event.target.value)}>
        <option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option>
      </select></label>
      {errors.priority && <p role="alert">{errors.priority}</p>}
      <label>Категория<select value={draft.categoryId} required onChange={event => update('categoryId', event.target.value)}>
        <option value="">Выберите категорию</option>
        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select></label>
      {errors.categoryId && <p role="alert">{errors.categoryId}</p>}
      {errors.form && <p role="alert">{errors.form}</p>}
      <button type="submit">{initialTask ? 'Сохранить' : 'Добавить задачу'}</button>
      {initialTask && <button type="button" onClick={onCancel}>Отмена</button>}
    </form>
  </section>;
}

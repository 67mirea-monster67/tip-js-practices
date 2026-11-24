import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';
const emptyDraft = () => ({ title: '', priority: 'medium', categoryId: '' });
export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => initialTask ? {
    title: initialTask.title, priority: initialTask.priority, categoryId: String(initialTask.categoryId),
  } : emptyDraft());
  const [errors, setErrors] = useState({});
  const change = event => setDraft(previous => ({ ...previous, [event.target.name]: event.target.value }));
  function submit(event) {
    event.preventDefault();
    const result = validateTaskDraft(draft, categories);
    setErrors(result.errors);
    if (!result.valid) return;
    if (onSave(result.value) !== true) { setErrors({ form: 'Не удалось сохранить задачу.' }); return; }
    if (!initialTask) setDraft(emptyDraft());
  }
  return <section aria-label="Форма задачи">
    <h2>{initialTask ? 'Редактирование задачи' : 'Новая задача'}</h2>
    <form onSubmit={submit} noValidate>
      <label htmlFor="task-title">Название</label>
      <input id="task-title" name="title" value={draft.title} onChange={change} required
        aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-error' : undefined} />
      {errors.title && <p id="title-error" role="alert">{errors.title}</p>}
      <label htmlFor="task-priority">Приоритет</label>
      <select id="task-priority" name="priority" value={draft.priority} onChange={change}
        aria-invalid={Boolean(errors.priority)} aria-describedby={errors.priority ? 'priority-error' : undefined}>
        <option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option>
      </select>
      {errors.priority && <p id="priority-error" role="alert">{errors.priority}</p>}
      <label htmlFor="task-category">Категория</label>
      <select id="task-category" name="categoryId" value={draft.categoryId} onChange={change} required
        aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? 'category-error' : undefined}>
        <option value="">Выберите категорию</option>
        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      {errors.categoryId && <p id="category-error" role="alert">{errors.categoryId}</p>}
      {errors.form && <p role="alert">{errors.form}</p>}
      <div className="actions"><button type="submit">{initialTask ? 'Сохранить' : 'Добавить задачу'}</button>
        {initialTask && <button type="button" onClick={onCancel}>Отмена</button>}</div>
    </form>
  </section>;
}

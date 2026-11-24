const priorityNames = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  return <li className={task.completed ? 'task completed' : 'task'} data-task-id={task.id}>
    <div className="task-heading"><strong>{task.title}</strong><span className="badge">{task.completed ? 'Завершена' : 'В работе'}</span></div>
    <p className="task-meta">№ {task.id} · {categoryName ?? 'Без категории'} · {priorityNames[task.priority]} приоритет</p>
    <div className="actions">
      <button type="button" onClick={() => onToggle(task.id)}>{task.completed ? 'Вернуть в работу' : 'Завершить'}</button>
      <button type="button" className="secondary" onClick={() => onEdit(task.id)}>Редактировать</button>
      <button type="button" className="danger" onClick={() => onDelete(task.id)}>Удалить</button>
    </div>
  </li>;
}

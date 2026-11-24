const priorities = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  return (
    <li className="task">
      <div><strong>{task.title}</strong>
        <div className="task-meta">
          <span className={task.completed ? 'done' : ''}>{task.completed ? 'Выполнена' : 'В работе'}</span>
          {' · '}{priorities[task.priority]}{' · '}{categoryName}
        </div>
      </div>
      <div className="actions">
        <button type="button" onClick={() => onToggle(task.id)}>{task.completed ? 'Вернуть в работу' : 'Завершить'}</button>
        <button type="button" onClick={() => onEdit(task.id)}>Изменить</button>
        <button type="button" onClick={() => onDelete(task.id)}>Удалить</button>
      </div>
    </li>
  );
}

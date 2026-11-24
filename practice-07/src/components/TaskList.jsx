import TaskItem from './TaskItem.jsx';
export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete }) {
  return <section aria-label="Список задач">
    <h2>Задачи <span className="count">{tasks.length}</span></h2>
    {tasks.length === 0 ? <p role="status">Список задач пуст</p> : <ul>
      {tasks.map(task => <TaskItem key={task.id} task={task}
        categoryName={categories.find(category => category.id === task.categoryId)?.name}
        onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}
    </ul>}
  </section>;
}

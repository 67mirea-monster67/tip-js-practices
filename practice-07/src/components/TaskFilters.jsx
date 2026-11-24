const statuses = [['', 'Все'], ['false', 'В работе'], ['true', 'Завершенные']];
export default function TaskFilters({ filters, categories, onChange }) {
  const change = event => onChange({ ...filters, [event.target.name]: event.target.value });
  return <section aria-label="Фильтры">
    <h2>Фильтры</h2><div className="filter-fields">
      <label htmlFor="search">Поиск<input id="search" name="q" maxLength={100} value={filters.q} onChange={change} /></label>
      <label htmlFor="priority-filter">Приоритет<select id="priority-filter" name="priority" value={filters.priority} onChange={change}>
        <option value="">Все приоритеты</option><option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option>
      </select></label>
      <label htmlFor="category-filter">Категория<select id="category-filter" name="categoryId" value={filters.categoryId} onChange={change}>
        <option value="">Все категории</option>
        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select></label>
    </div>
    <div className="status-buttons" role="group" aria-label="Статус">
      {statuses.map(([value, title]) => <button key={value} type="button" aria-pressed={filters.completed === value}
        onClick={() => onChange({ ...filters, completed: value })}>{title}</button>)}
      <button type="button" className="secondary" onClick={() => onChange({ q: '', priority: '', categoryId: '', completed: '' })}>Сбросить фильтры</button>
    </div>
  </section>;
}

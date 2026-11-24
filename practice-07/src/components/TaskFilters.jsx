const statusOptions = [
  ['', 'Все'], ['false', 'В работе'], ['true', 'Завершенные'],
];

export default function TaskFilters({ filters, categories, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <section aria-label="Фильтры">
      <h2>Фильтры</h2>
      <div className="filters">
        <label>Поиск<input value={filters.q} onChange={event => update('q', event.target.value)} /></label>
        <label>Приоритет<select value={filters.priority} onChange={event => update('priority', event.target.value)}>
          <option value="">Все приоритеты</option><option value="low">Низкий</option>
          <option value="medium">Средний</option><option value="high">Высокий</option>
        </select></label>
        <label>Категория<select value={filters.categoryId} onChange={event => update('categoryId', event.target.value)}>
          <option value="">Все категории</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select></label>
      </div>
      <div role="group" aria-label="Статус">
        {statusOptions.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={filters.completed === value}
            onClick={() => update('completed', value)}>{label}</button>
        ))}
        <button type="button" onClick={() => onChange({ q: '', completed: '', priority: '', categoryId: '' })}>
          Сбросить фильтры
        </button>
      </div>
    </section>
  );
}

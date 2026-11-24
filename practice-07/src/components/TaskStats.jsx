export default function TaskStats({ stats }) {
  return <section aria-label="Статистика" className="stats">
    <span>Всего <strong>{stats.total}</strong></span>
    <span>Выполнено <strong>{stats.completed}</strong></span>
    <span>В работе <strong>{stats.active}</strong></span>
  </section>;
}

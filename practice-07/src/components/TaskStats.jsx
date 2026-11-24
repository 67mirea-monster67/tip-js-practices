export default function TaskStats({ stats }) {
  return <section className="stats" aria-label="Статистика">
    <p>Всего <strong>{stats.total}</strong></p><p>В работе <strong>{stats.active}</strong></p><p>Завершено <strong>{stats.completed}</strong></p>
  </section>;
}

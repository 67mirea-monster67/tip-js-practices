export function searchTasks(tasks, query) {
  const value = query.trim().toLowerCase();

  if (value === "") {
    return [...tasks];
  }

  return tasks.filter((task) => task.title.toLowerCase().includes(value));
}

import { useEffect, useRef, useState } from 'react';

export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [version, setVersion] = useState(0);
  const mutation = useRef(null);
  const { q, completed, priority, categoryId } = filters;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setStatus('loading');
    setError(null);

    async function load() {
      try {
        const result = await api.loadInitialData({ q, completed, priority, categoryId }, { signal });
        if (signal.aborted) return;
        setSnapshot(result);
        setStatus('ready');
      } catch (failure) {
        if (signal.aborted) return;
        setError(failure);
        setStatus('error');
      }
    }

    load();
    return () => controller.abort();
  }, [api, q, completed, priority, categoryId, version]);

  useEffect(() => () => mutation.current?.abort(), []);

  function refresh() {
    setVersion(previous => previous + 1);
  }

  async function mutate(operation) {
    if (mutation.current) return false;
    const controller = new AbortController();
    const { signal } = controller;
    mutation.current = controller;
    setPending(true);
    setMutationError(null);
    try {
      await operation({ signal });
      if (signal.aborted) return false;
      refresh();
      return true;
    } catch (failure) {
      if (!signal.aborted) setMutationError(failure);
      return false;
    } finally {
      mutation.current = null;
      if (!signal.aborted) setPending(false);
    }
  }

  return {
    snapshot, tasks: snapshot.tasks, status, isLoading: status === 'loading',
    error, mutationError, pending, refresh,
    saveTask: (id, value) => mutate(options =>
      id === null ? api.createTask(value, options) : api.updateTask(id, value, options)),
    toggleTask: task => mutate(options => api.setTaskCompleted(task.id, !task.completed, options)),
    deleteTask: id => mutate(options => api.deleteTask(id, options)),
    resetData: () => mutate(options => api.resetDemoData(options)),
  };
}

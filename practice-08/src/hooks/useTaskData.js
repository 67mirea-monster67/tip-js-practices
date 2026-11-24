import { useEffect, useRef, useState } from 'react';

export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const mounted = useRef(false);
  const currentMutation = useRef(null);
  const { q, completed, priority, categoryId } = filters;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      currentMutation.current?.abort();
      currentMutation.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setStatus('loading');
    setError(null);
    async function load() {
      try {
        const result = await api.loadInitialData(
          { q, completed, priority, categoryId }, { signal: controller.signal });
        if (!active || controller.signal.aborted) return;
        setSnapshot(result);
        setStatus('ready');
      } catch (failure) {
        if (!active || controller.signal.aborted) return;
        setError(failure);
        setStatus('error');
      }
    }
    load();
    return () => { active = false; controller.abort(); };
  }, [api, q, completed, priority, categoryId, revision]);

  function refresh() {
    if (mounted.current) setRevision(previous => previous + 1);
  }
  async function mutate(operation) {
    if (!mounted.current || currentMutation.current) return false;
    const controller = new AbortController();
    currentMutation.current = controller;
    setPending(true);
    setMutationError(null);
    try {
      await operation({ signal: controller.signal });
      if (!mounted.current || controller.signal.aborted) return false;
      refresh();
      return true;
    } catch (failure) {
      if (mounted.current && !controller.signal.aborted) setMutationError(failure);
      return false;
    } finally {
      if (currentMutation.current === controller) {
        currentMutation.current = null;
        if (mounted.current) setPending(false);
      }
    }
  }
  return {
    snapshot, tasks: snapshot.tasks, isLoading: status === 'loading',
    status, error, mutationError, pending, refresh,
    saveTask: (id, value) => mutate(options => id === null
      ? api.createTask(value, options) : api.updateTask(id, value, options)),
    toggleTask: task => mutate(options => api.setTaskCompleted(task.id, !task.completed, options)),
    deleteTask: id => mutate(options => api.deleteTask(id, options)),
    resetData: () => mutate(options => api.resetDemoData(options)),
  };
}

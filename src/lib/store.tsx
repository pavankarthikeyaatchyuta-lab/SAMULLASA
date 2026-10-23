'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  AppState,
  EventDetails,
  Scenario,
  BudgetItem,
  Task,
  Vendor,
} from '@/types/events';
import { generateSampleData } from '@/lib/sample-data';

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'samullasa-state';

const INITIAL_STATE: AppState = {
  events: [],
  scenarios: {},
  version: 0,
};

// ─── Action Types ────────────────────────────────────────────────────────────

type Action =
  | { type: 'CREATE_EVENT'; payload: { event: EventDetails; scenario: Scenario } }
  | { type: 'UPDATE_EVENT'; payload: { eventId: string; updates: Partial<EventDetails> } }
  | { type: 'DELETE_EVENT'; payload: { eventId: string } }
  | { type: 'SET_SCENARIO'; payload: { scenario: Scenario } }
  | { type: 'APPROVE_SCENARIO'; payload: { scenarioId: string; eventId: string } | { scenario: Scenario; eventId: string } }
  | { type: 'REJECT_SCENARIO'; payload: { scenarioId: string } }
  | { type: 'UPDATE_BUDGET_ITEM'; payload: { scenarioId: string; itemId: string; updates: Partial<BudgetItem> } }
  | { type: 'ADD_BUDGET_ITEM'; payload: { scenarioId: string; item: BudgetItem } }
  | { type: 'REMOVE_BUDGET_ITEM'; payload: { scenarioId: string; itemId: string } }
  | { type: 'UPDATE_TASK'; payload: { scenarioId: string; taskId: string; updates: Partial<Task> } }
  | { type: 'ADD_TASK'; payload: { scenarioId: string; task: Task } }
  | { type: 'REMOVE_TASK'; payload: { scenarioId: string; taskId: string } }
  | { type: 'UPDATE_VENDOR'; payload: { scenarioId: string; vendorId: string; updates: Partial<Vendor> } }
  | { type: 'ADD_VENDOR'; payload: { scenarioId: string; vendor: Vendor } }
  | { type: 'REMOVE_VENDOR'; payload: { scenarioId: string; vendorId: string } }
  | { type: 'LOAD_SAMPLE_DATA'; payload?: { events?: EventDetails[]; scenarios?: Record<string, Scenario> } }
  | { type: 'RESET' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function persistState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
    console.warn('SAMULLĀSA: Failed to persist state to localStorage.');
  }
}

function loadPersistedState(): AppState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.events) &&
      parsed.scenarios &&
      typeof parsed.scenarios === 'object' &&
      typeof parsed.version === 'number'
    ) {
      return parsed as AppState;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Scenario Helpers ────────────────────────────────────────────────────────

function updateScenarioRecord(
  scenarios: Record<string, Scenario>,
  scenarioId: string,
  updater: (scenario: Scenario) => Scenario,
): Record<string, Scenario> {
  const existing = scenarios[scenarioId];
  if (!existing) return scenarios;
  return {
    ...scenarios,
    [scenarioId]: updater(existing),
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function storeReducer(state: AppState, action: Action): AppState {
  const timestamp = now();
  let nextState: AppState;

  switch (action.type) {
    case 'CREATE_EVENT': {
      const { event, scenario } = action.payload;
      nextState = {
        ...state,
        events: [...state.events, { ...event, createdAt: timestamp, updatedAt: timestamp }],
        scenarios: {
          ...state.scenarios,
          [scenario.id]: { ...scenario, createdAt: timestamp },
        },
        version: state.version + 1,
      };
      break;
    }

    case 'UPDATE_EVENT': {
      const { eventId, updates } = action.payload;
      nextState = {
        ...state,
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, ...updates, updatedAt: timestamp } : e,
        ),
        version: state.version + 1,
      };
      break;
    }

    case 'DELETE_EVENT': {
      const { eventId } = action.payload;
      const event = state.events.find((e) => e.id === eventId);
      const scenarioIdsToRemove = new Set(event?.scenarioHistory ?? []);
      const nextScenarios = { ...state.scenarios };
      for (const sid of scenarioIdsToRemove) {
        delete nextScenarios[sid];
      }
      nextState = {
        ...state,
        events: state.events.filter((e) => e.id !== eventId),
        scenarios: nextScenarios,
        version: state.version + 1,
      };
      break;
    }

    case 'SET_SCENARIO': {
      const { scenario } = action.payload;
      // Also add to the event's scenarioHistory if not already present
      nextState = {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== scenario.eventId) return e;
          const history = e.scenarioHistory.includes(scenario.id)
            ? e.scenarioHistory
            : [...e.scenarioHistory, scenario.id];
          return { ...e, scenarioHistory: history, updatedAt: timestamp };
        }),
        scenarios: {
          ...state.scenarios,
          [scenario.id]: { ...scenario, createdAt: scenario.createdAt || timestamp },
        },
        version: state.version + 1,
      };
      break;
    }

    case 'APPROVE_SCENARIO': {
      const { eventId } = action.payload;
      const targetScenario = 'scenario' in action.payload ? action.payload.scenario : undefined;
      const targetScenarioId = 'scenarioId' in action.payload ? action.payload.scenarioId : action.payload.scenario.id;

      const candidate = targetScenario ?? state.scenarios[targetScenarioId];
      if (candidate && candidate.isFeasible === false) {
        console.warn('SAMULLĀSA: Blocked approval of scenario with hard constraint violations.');
        return state;
      }

      nextState = {
        ...state,
        events: state.events.map((e) =>
          e.id === eventId
            ? {
                ...e,
                currentScenarioId: targetScenarioId,
                scenarioHistory: e.scenarioHistory.includes(targetScenarioId)
                  ? e.scenarioHistory
                  : [...e.scenarioHistory, targetScenarioId],
                updatedAt: timestamp,
              }
            : e,
        ),
        scenarios: targetScenario
          ? {
              ...state.scenarios,
              [targetScenario.id]: {
                ...targetScenario,
                status: 'approved',
                approvedAt: timestamp,
              },
            }
          : updateScenarioRecord(state.scenarios, targetScenarioId, (s) => ({
              ...s,
              status: 'approved',
              approvedAt: timestamp,
            })),
        version: state.version + 1,
      };
      break;
    }

    case 'REJECT_SCENARIO': {
      const { scenarioId } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          status: 'rejected',
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'UPDATE_BUDGET_ITEM': {
      const { scenarioId, itemId, updates } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          budgetItems: s.budgetItems.map((item) =>
            item.id === itemId
              ? { ...item, ...updates, updatedAt: timestamp }
              : item,
          ),
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'ADD_BUDGET_ITEM': {
      const { scenarioId, item } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          budgetItems: [...s.budgetItems, { ...item, createdAt: timestamp, updatedAt: timestamp }],
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'REMOVE_BUDGET_ITEM': {
      const { scenarioId, itemId } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          budgetItems: s.budgetItems.filter((item) => item.id !== itemId),
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'UPDATE_TASK': {
      const { scenarioId, taskId, updates } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          tasks: s.tasks.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updatedAt: timestamp }
              : task,
          ),
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'ADD_TASK': {
      const { scenarioId, task } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          tasks: [...s.tasks, { ...task, createdAt: timestamp, updatedAt: timestamp }],
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'REMOVE_TASK': {
      const { scenarioId, taskId } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          tasks: s.tasks.filter((task) => task.id !== taskId),
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'UPDATE_VENDOR': {
      const { scenarioId, vendorId, updates } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          vendors: s.vendors.map((vendor) =>
            vendor.id === vendorId
              ? { ...vendor, ...updates, updatedAt: timestamp }
              : vendor,
          ),
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'ADD_VENDOR': {
      const { scenarioId, vendor } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          vendors: [...s.vendors, { ...vendor, createdAt: timestamp, updatedAt: timestamp }],
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'REMOVE_VENDOR': {
      const { scenarioId, vendorId } = action.payload;
      nextState = {
        ...state,
        scenarios: updateScenarioRecord(state.scenarios, scenarioId, (s) => ({
          ...s,
          vendors: s.vendors.filter((vendor) => vendor.id !== vendorId),
        })),
        version: state.version + 1,
      };
      break;
    }

    case 'LOAD_SAMPLE_DATA': {
      const sample = action.payload && action.payload.events && action.payload.scenarios
        ? { events: action.payload.events, scenarios: action.payload.scenarios }
        : generateSampleData();
      nextState = {
        events: [...state.events, ...sample.events],
        scenarios: { ...state.scenarios, ...sample.scenarios },
        version: state.version + 1,
      };
      break;
    }

    case 'RESET': {
      nextState = { ...INITIAL_STATE, version: state.version + 1 };
      break;
    }

    default: {
      // Exhaustive check: if we ever miss a case the build will fail
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }

  // Persist after every mutation
  persistState(nextState);
  return nextState;
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  getEvent: (eventId: string) => EventDetails | undefined;
  getScenario: (scenarioId: string) => Scenario | undefined;
  getCurrentScenario: (eventId: string) => Scenario | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

function getInitialState(): AppState {
  // During SSR, localStorage is unavailable — return default state
  if (typeof window === 'undefined') return INITIAL_STATE;
  return loadPersistedState() ?? INITIAL_STATE;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, undefined, getInitialState);

  // Sync from other tabs via the storage event
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue) as AppState;
        if (incoming.version > state.version) {
          // Overwrite local state with the newer version from another tab
          dispatch({
            type: 'LOAD_SAMPLE_DATA',
            payload: { events: incoming.events, scenarios: incoming.scenarios },
          });
        }
      } catch {
        // Malformed data — ignore
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [state.version]);

  const getEvent = useCallback(
    (eventId: string): EventDetails | undefined =>
      state.events.find((e) => e.id === eventId),
    [state.events],
  );

  const getScenario = useCallback(
    (scenarioId: string): Scenario | undefined => state.scenarios[scenarioId],
    [state.scenarios],
  );

  const getCurrentScenario = useCallback(
    (eventId: string): Scenario | undefined => {
      const event = state.events.find((e) => e.id === eventId);
      if (!event) return undefined;
      return state.scenarios[event.currentScenarioId];
    },
    [state.events, state.scenarios],
  );

  return (
    <StoreContext.Provider value={{ state, dispatch, getEvent, getScenario, getCurrentScenario }}>
      {children}
    </StoreContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error(
      'useStore must be used within a <StoreProvider>. ' +
        'Wrap your component tree with <StoreProvider> in your layout.',
    );
  }
  return context;
}

// ─── Re-export Action type for consumers ─────────────────────────────────────

export type { Action as StoreAction };

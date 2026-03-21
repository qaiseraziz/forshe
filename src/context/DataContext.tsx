import React, { createContext, useContext, useCallback } from 'react';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../constants/data';
import { SEED_HISTORY, SEED_COOKING, SEED_MAID } from '../constants/seedData';
import {
  Transaction, CookingData, MaidData, Attendance, Reminder, PeriodLog,
  BackupData, RecurringExpense, ShoppingItem, MaidSalary,
} from '../types';

interface DataCtx {
  history: Transaction[];
  setHistory: (v: Transaction[] | ((p: Transaction[]) => Transaction[])) => void;
  cooking: CookingData;
  setCooking: (v: CookingData | ((p: CookingData) => CookingData)) => void;
  maidData: MaidData;
  setMaidData: (v: MaidData | ((p: MaidData) => MaidData)) => void;
  attendance: Attendance;
  setAttendance: (v: Attendance | ((p: Attendance) => Attendance)) => void;
  reminders: Reminder[];
  setReminders: (v: Reminder[] | ((p: Reminder[]) => Reminder[])) => void;
  periods: PeriodLog[];
  setPeriods: (v: PeriodLog[] | ((p: PeriodLog[]) => PeriodLog[])) => void;
  budget: number;
  setBudget: (v: number | ((p: number) => number)) => void;
  recurring: RecurringExpense[];
  setRecurring: (v: RecurringExpense[] | ((p: RecurringExpense[]) => RecurringExpense[])) => void;
  shopping: ShoppingItem[];
  setShopping: (v: ShoppingItem[] | ((p: ShoppingItem[]) => ShoppingItem[])) => void;
  maidSalary: MaidSalary[];
  setMaidSalary: (v: MaidSalary[] | ((p: MaidSalary[]) => MaidSalary[])) => void;
  allLoaded: boolean;
  handleImport: (data: BackupData) => void;
}

const DataContext = createContext<DataCtx>({} as DataCtx);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory, l1] = useStorage<Transaction[]>(STORAGE_KEYS.history, SEED_HISTORY);
  const [cooking, setCooking, l2] = useStorage<CookingData>(STORAGE_KEYS.cooking, SEED_COOKING);
  const [maidData, setMaidData, l3] = useStorage<MaidData>(STORAGE_KEYS.maidData, SEED_MAID);
  const [attendance, setAttendance, l4] = useStorage<Attendance>(STORAGE_KEYS.attendance, {});
  const [reminders, setReminders, l5] = useStorage<Reminder[]>(STORAGE_KEYS.reminders, []);
  const [periods, setPeriods, l6] = useStorage<PeriodLog[]>(STORAGE_KEYS.periods, []);
  const [budget, setBudget, l7] = useStorage<number>(STORAGE_KEYS.budget, 0);
  const [recurring, setRecurring, l8] = useStorage<RecurringExpense[]>(STORAGE_KEYS.recurring, []);
  const [shopping, setShopping, l9] = useStorage<ShoppingItem[]>(STORAGE_KEYS.shopping, []);
  const [maidSalary, setMaidSalary, l10] = useStorage<MaidSalary[]>(STORAGE_KEYS.maidSalary, []);

  const allLoaded = l1 && l2 && l3 && l4 && l5 && l6 && l7 && l8 && l9 && l10;

  const handleImport = useCallback((data: BackupData) => {
    if (data.history) setHistory(data.history);
    if (data.cooking) setCooking(data.cooking);
    if (data.maidData) setMaidData(data.maidData);
    if (data.maidAttendance) setAttendance(data.maidAttendance);
    if (data.reminders) setReminders(data.reminders);
    if (data.periodLogs) setPeriods(data.periodLogs);
    if (typeof data.budget === 'number') setBudget(data.budget);
    if (data.recurringExpenses) setRecurring(data.recurringExpenses);
    if (data.shoppingList) setShopping(data.shoppingList);
    if (data.maidSalary) setMaidSalary(data.maidSalary);
  }, [setHistory, setCooking, setMaidData, setAttendance, setReminders, setPeriods, setBudget, setRecurring, setShopping, setMaidSalary]);

  return (
    <DataContext.Provider value={{
      history, setHistory,
      cooking, setCooking,
      maidData, setMaidData,
      attendance, setAttendance,
      reminders, setReminders,
      periods, setPeriods,
      budget, setBudget,
      recurring, setRecurring,
      shopping, setShopping,
      maidSalary, setMaidSalary,
      allLoaded,
      handleImport,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}

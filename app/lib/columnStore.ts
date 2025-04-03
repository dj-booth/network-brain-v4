import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ColumnType } from '../components/ui/column-type-selector';

export interface ColumnOption {
  value: string;
  label: string;
  color?: string;
}

export interface ColumnConfig {
  type: ColumnType;
  options?: ColumnOption[];
}

interface ColumnStore {
  columns: Record<string, ColumnConfig>;
  setColumnType: (columnId: string, type: ColumnType) => void;
  addColumnOption: (columnId: string, option: ColumnOption) => void;
  removeColumnOption: (columnId: string, optionValue: string) => void;
  getColumnConfig: (columnId: string) => ColumnConfig;
  getColumnOptions: (columnId: string) => ColumnOption[];
}

// Helper function to generate a random pastel color
export const generatePastelColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
};

export const useColumnStore = create<ColumnStore>()(
  persist(
    (set, get) => ({
      columns: {},
      
      setColumnType: (columnId, type) => {
        set((state) => {
          const currentConfig = state.columns[columnId] || { type: 'text' };
          const updatedConfig = { 
            ...currentConfig, 
            type,
            // Initialize options array if switching to select types
            options: (type === 'single-select' || type === 'multi-select') 
              ? currentConfig.options || []
              : undefined
          };
          
          return {
            columns: {
              ...state.columns,
              [columnId]: updatedConfig
            }
          };
        });
      },
      
      addColumnOption: (columnId, option) => {
        set((state) => {
          const currentConfig = state.columns[columnId] || { 
            type: 'single-select', 
            options: [] 
          };
          
          // Don't add if option with same value already exists
          if (currentConfig.options?.some(opt => opt.value === option.value)) {
            return { columns: state.columns };
          }
          
          const newOption = {
            ...option,
            color: option.color || generatePastelColor()
          };
          
          const updatedConfig = {
            ...currentConfig,
            options: [...(currentConfig.options || []), newOption]
          };
          
          return {
            columns: {
              ...state.columns,
              [columnId]: updatedConfig
            }
          };
        });
      },
      
      removeColumnOption: (columnId, optionValue) => {
        set((state) => {
          const currentConfig = state.columns[columnId];
          if (!currentConfig || !currentConfig.options) return { columns: state.columns };
          
          const updatedConfig = {
            ...currentConfig,
            options: currentConfig.options.filter(opt => opt.value !== optionValue)
          };
          
          return {
            columns: {
              ...state.columns,
              [columnId]: updatedConfig
            }
          };
        });
      },
      
      getColumnConfig: (columnId) => {
        return get().columns[columnId] || { type: 'text' };
      },
      
      getColumnOptions: (columnId) => {
        const config = get().columns[columnId];
        return config?.options || [];
      }
    }),
    {
      name: 'column-store',
    }
  )
); 
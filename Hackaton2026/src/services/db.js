import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully.');
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
} else {
  console.info('Supabase credentials not found. Falling back to local storage database.');
}

export const dbService = {
  isSupabaseConnected: () => supabase !== null,

  saveGameSet: async (gameSet) => {
    const id = gameSet.id || crypto.randomUUID();
    const preparedSet = {
      ...gameSet,
      id,
      createdAt: gameSet.createdAt || new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('game_sets')
          .insert([preparedSet])
          .select();

        if (error) throw error;
        return data[0];
      } catch (err) {
        console.error('Supabase saveGameSet error, falling back to localStorage:', err);
      }
    }

    return saveToLocal('game_sets', preparedSet);
  },

  getGameSets: async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('game_sets')
          .select('*')
          .order('createdAt', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Supabase getGameSets error, falling back to localStorage:', err);
      }
    }

    return getFromLocal('game_sets');
  },

  getGameSetById: async (id) => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('game_sets')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase getGameSetById error, falling back to localStorage:', err);
      }
    }

    return getFromLocal('game_sets').find((set) => set.id === id) || null;
  },

  deleteGameSet: async (id) => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('game_sets')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Supabase deleteGameSet error, falling back to localStorage:', err);
      }
    }

    return deleteFromLocal('game_sets', id);
  },

  saveUserProgress: async (progressItem) => {
    const id = progressItem.id || crypto.randomUUID();
    const preparedProgress = {
      ...progressItem,
      id,
      timestamp: progressItem.timestamp || new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .insert([preparedProgress])
          .select();

        if (error) throw error;
        return data[0];
      } catch (err) {
        console.error('Supabase saveUserProgress error, falling back to localStorage:', err);
      }
    }

    return saveToLocal('user_progress', preparedProgress);
  },

  getUserProgress: async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Supabase getUserProgress error, falling back to localStorage:', err);
      }
    }

    return getFromLocal('user_progress');
  },

  clearAllProgress: async () => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('user_progress')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      } catch (err) {
        console.error('Supabase clearAllProgress error:', err);
      }
    }

    localStorage.removeItem('studyquest_user_progress');
    return true;
  },
};

function getFromLocal(key) {
  const storageKey = `studyquest_${key}`;
  const data = localStorage.getItem(storageKey);
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`Invalid local data for ${storageKey}; resetting it.`, err);
    localStorage.removeItem(storageKey);
    return [];
  }
}

function saveToLocal(key, item) {
  const items = getFromLocal(key);
  const index = items.findIndex((existing) => existing.id === item.id);

  if (index !== -1) {
    items[index] = item;
  } else {
    items.unshift(item);
  }

  localStorage.setItem(`studyquest_${key}`, JSON.stringify(items));
  return item;
}

function deleteFromLocal(key, id) {
  const filtered = getFromLocal(key).filter((item) => item.id !== id);
  localStorage.setItem(`studyquest_${key}`, JSON.stringify(filtered));
  return true;
}

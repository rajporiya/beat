import { create } from "zustand";
import type { Song } from "@/types";

export type RepeatMode = "off" | "all" | "one";

const HISTORY_LIMIT = 50;

interface PlayerState {
    currentSong: Song | null;
    isPlaying: boolean;
    queue: Song[];
    currentIndex: number;
    shuffleOrder: number[];
    userQueue: Song[];
    history: Song[];
    shuffle: boolean;
    repeat: RepeatMode;
}

interface PlayerStore extends PlayerState {
    initalizeQueue: (songs: Song[]) => void;
    playerAlbum: (songs: Song[], startIndex?: number) => void;
    setCurrentSong: (song: Song | null) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrevious: () => boolean;
    playQueueIndex: (index: number) => void;
    playUserQueueItem: (index: number) => void;
    addToQueue: (song: Song) => void;
    removeFromUserQueue: (index: number) => void;
    clearUserQueue: () => void;
    setShuffle: (enabled: boolean) => void;
    toggleShuffle: () => void;
    cycleRepeat: () => void;
}

const makeShuffleOrder = (length: number, first: number) => {
    const order = Array.from({ length }, (_, index) => index);
    for (let index = order.length - 1; index > 0; index--) {
        const swap = Math.floor(Math.random() * (index + 1));
        [order[index], order[swap]] = [order[swap], order[index]];
    }
    if (first >= 0 && first < length) {
        order.splice(order.indexOf(first), 1);
        order.unshift(first);
    }
    return order;
};

const pushHistory = (history: Song[], song: Song | null) =>
    song ? [...history, song].slice(-HISTORY_LIMIT) : history;

const resolveContextNext = (state: PlayerState): { index: number; shuffleOrder: number[] } | null => {
    const { queue, currentIndex, repeat, shuffle } = state;
    if (queue.length === 0) return null;

    if (shuffle) {
        const order =
            state.shuffleOrder.length === queue.length
                ? state.shuffleOrder
                : makeShuffleOrder(queue.length, currentIndex);
        const position = order.indexOf(currentIndex);
        if (position + 1 < order.length) return { index: order[position + 1], shuffleOrder: order };
        if (repeat !== "all") return null;
        const freshOrder = makeShuffleOrder(queue.length, -1);
        return { index: freshOrder[0], shuffleOrder: freshOrder };
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) return { index: nextIndex, shuffleOrder: state.shuffleOrder };
    if (repeat === "all") return { index: 0, shuffleOrder: state.shuffleOrder };
    return null;
};

export const selectUpcomingIndices = (state: PlayerState): number[] => {
    const { queue, currentIndex, shuffle, shuffleOrder } = state;
    if (queue.length === 0) return [];
    if (shuffle && shuffleOrder.length === queue.length) {
        const position = shuffleOrder.indexOf(currentIndex);
        return shuffleOrder.slice(position + 1);
    }
    return Array.from(
        { length: Math.max(queue.length - currentIndex - 1, 0) },
        (_, offset) => currentIndex + 1 + offset,
    );
};

export const selectNextSong = (state: PlayerState): Song | null => {
    if (state.userQueue.length > 0) return state.userQueue[0];
    const upcoming = selectUpcomingIndices(state);
    if (upcoming.length > 0) return state.queue[upcoming[0]];
    return state.repeat === "all" && state.queue.length > 0 ? state.queue[0] : null;
};

export const usePlayStore = create<PlayerStore>((set, get) => ({
    currentSong: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    shuffleOrder: [],
    userQueue: [],
    history: [],
    shuffle: false,
    repeat: "off",

    initalizeQueue: (songs) => {
        const { currentSong, shuffle } = get();
        const nextCurrent = currentSong || songs[0] || null;
        const index = nextCurrent ? songs.findIndex((song) => song._id === nextCurrent._id) : -1;
        set({
            queue: songs,
            currentSong: nextCurrent,
            currentIndex: index,
            shuffleOrder: shuffle ? makeShuffleOrder(songs.length, index) : [],
        });
    },

    playerAlbum: (songs, startIndex = 0) => {
        if (songs.length === 0) return;
        const index = Math.min(Math.max(startIndex, 0), songs.length - 1);
        set({
            queue: songs,
            currentSong: songs[index],
            currentIndex: index,
            isPlaying: true,
            history: [],
            shuffleOrder: get().shuffle ? makeShuffleOrder(songs.length, index) : [],
        });
    },

    setCurrentSong: (song) => {
        if (!song) return;
        const { queue, currentSong, history, shuffle, shuffleOrder } = get();
        const nextHistory =
            currentSong && currentSong._id !== song._id ? pushHistory(history, currentSong) : history;
        const index = queue.findIndex((item) => item._id === song._id);

        if (index === -1) {
            set({
                queue: [song],
                currentSong: song,
                currentIndex: 0,
                isPlaying: true,
                history: nextHistory,
                shuffleOrder: [0],
            });
            return;
        }

        set({
            currentSong: song,
            currentIndex: index,
            isPlaying: true,
            history: nextHistory,
            shuffleOrder: shuffle ? makeShuffleOrder(queue.length, index) : shuffleOrder,
        });
    },

    togglePlay: () => {
        set({ isPlaying: !get().isPlaying });
    },

    playNext: () => {
        const state = get();
        const { userQueue, currentSong, history } = state;

        if (userQueue.length > 0) {
            const [nextSong, ...rest] = userQueue;
            set({
                currentSong: nextSong,
                userQueue: rest,
                isPlaying: true,
                history: pushHistory(history, currentSong),
            });
            return;
        }

        const next = resolveContextNext(state);
        if (!next) {
            set({ isPlaying: false });
            return;
        }

        set({
            currentSong: state.queue[next.index],
            currentIndex: next.index,
            shuffleOrder: next.shuffleOrder,
            isPlaying: true,
            history: pushHistory(history, currentSong),
        });
    },

    playPrevious: () => {
        const state = get();
        const { history, queue, currentIndex, shuffle, repeat } = state;

        if (history.length > 0) {
            const previousSong = history[history.length - 1];
            const index = queue.findIndex((song) => song._id === previousSong._id);
            set({
                currentSong: previousSong,
                currentIndex: index !== -1 ? index : currentIndex,
                isPlaying: true,
                history: history.slice(0, -1),
            });
            return true;
        }

        if (!shuffle && currentIndex >= 0 && queue.length > 0) {
            const previousIndex =
                currentIndex > 0 ? currentIndex - 1 : repeat === "all" ? queue.length - 1 : -1;
            if (previousIndex >= 0) {
                set({ currentSong: queue[previousIndex], currentIndex: previousIndex, isPlaying: true });
                return true;
            }
        }

        return false;
    },

    playQueueIndex: (index) => {
        const { queue, currentSong, history } = get();
        if (index < 0 || index >= queue.length) return;
        const song = queue[index];
        set({
            currentSong: song,
            currentIndex: index,
            isPlaying: true,
            history: currentSong && currentSong._id !== song._id ? pushHistory(history, currentSong) : history,
        });
    },

    playUserQueueItem: (index) => {
        const { userQueue, currentSong, history } = get();
        const song = userQueue[index];
        if (!song) return;
        set({
            currentSong: song,
            userQueue: userQueue.filter((_, position) => position !== index),
            isPlaying: true,
            history: pushHistory(history, currentSong),
        });
    },

    addToQueue: (song) => {
        if (!get().currentSong) {
            get().setCurrentSong(song);
            return;
        }
        set((state) => ({ userQueue: [...state.userQueue, song] }));
    },

    removeFromUserQueue: (index) => {
        set((state) => ({ userQueue: state.userQueue.filter((_, position) => position !== index) }));
    },

    clearUserQueue: () => {
        set({ userQueue: [] });
    },

    setShuffle: (enabled) => {
        const { queue, currentIndex, shuffleOrder } = get();
        set({
            shuffle: enabled,
            shuffleOrder: enabled ? makeShuffleOrder(queue.length, currentIndex) : shuffleOrder,
        });
    },

    toggleShuffle: () => {
        get().setShuffle(!get().shuffle);
    },

    cycleRepeat: () => {
        set((state) => ({
            repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off",
        }));
    },
}));

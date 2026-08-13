export const BREAKPOINTS = {
  mobile: 375,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
} as const;

export function setViewport(width: number, height = 800) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

export function mockMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as (query: string) => MediaQueryList;
}

export function spyOnMatchMedia() {
  const listeners = new Map<string, Set<(e: MediaQueryListEvent) => void>>();
  const mediaQueries = new Map<string, MediaQueryList>();

  const getCallbacks = (query: string) => {
    if (!listeners.has(query)) listeners.set(query, new Set());
    return listeners.get(query)!;
  };

  const createMediaQuery = (query: string): MediaQueryList => {
    if (!mediaQueries.has(query)) {
      const callbacks = getCallbacks(query);
      const mq: MediaQueryList = {
        matches: false,
        media: query,
        onchange: null,
        addListener: (cb: (e: MediaQueryListEvent) => void) => callbacks.add(cb),
        removeListener: (cb: (e: MediaQueryListEvent) => void) => callbacks.delete(cb),
        addEventListener: ((
          type: string,
          listener: EventListenerOrEventListenerObject,
          _options?: boolean | AddEventListenerOptions
        ) => {
          if (type === 'change' && typeof listener === 'function') {
            callbacks.add(listener as (e: MediaQueryListEvent) => void);
          }
        }) as (
          type: string,
          listener: EventListenerOrEventListenerObject,
          _options?: boolean | AddEventListenerOptions
        ) => void,
        removeEventListener: ((
          type: string,
          listener: EventListenerOrEventListenerObject,
          _options?: boolean | EventListenerOptions
        ) => {
          if (type === 'change' && typeof listener === 'function') {
            callbacks.delete(listener as (e: MediaQueryListEvent) => void);
          }
        }) as (
          type: string,
          listener: EventListenerOrEventListenerObject,
          _options?: boolean | EventListenerOptions
        ) => void,
        dispatchEvent: () => false,
      };
      mediaQueries.set(query, mq);
    }
    return mediaQueries.get(query)!;
  };

  window.matchMedia = ((query: string) => createMediaQuery(query)) as unknown as (query: string) => MediaQueryList;

  const emit = (query: string, matches: boolean) => {
    const mq = createMediaQuery(query);
    Object.defineProperty(mq, 'matches', { value: matches, writable: true, configurable: true });
    const callbacks = getCallbacks(query);
    const event = { matches, media: query } as MediaQueryListEvent;
    callbacks.forEach((cb) => cb(event));
    if (mq.onchange) mq.onchange(event);
  };

  return { emit };
}

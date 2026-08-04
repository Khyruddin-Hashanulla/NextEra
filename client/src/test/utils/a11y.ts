import { configureAxe } from 'jest-axe';

export const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: false },
    'link-in-text-block': { enabled: false },
  },
});

export async function runA11yChecks(container: HTMLElement) {
  return axe(container);
}

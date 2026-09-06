import { useEffect, useRef } from 'react';

/**
 * Universal Back Navigation Stack Manager
 * Handles hardware/browser back button, swipe gestures, and Android back button
 * without requiring any exit confirmation prompts when at the root level.
 */

interface BackAction {
  id: string;
  onBack: () => void;
}

const backActionStack: BackAction[] = [];
let isIgnoringPopState = false;
let isListenerAttached = false;

function initPopStateListener() {
  if (typeof window === 'undefined' || isListenerAttached) return;
  isListenerAttached = true;

  window.addEventListener('popstate', () => {
    if (isIgnoringPopState) {
      isIgnoringPopState = false;
      return;
    }

    if (backActionStack.length > 0) {
      const topAction = backActionStack.pop();
      if (topAction) {
        try {
          topAction.onBack();
        } catch (err) {
          console.error('Error executing back action:', err);
        }
      }
    }
  });
}

/**
 * Pushes a new back action onto the navigation stack
 */
export function pushBackAction(id: string, onBack: () => void) {
  initPopStateListener();

  // If action with same id already exists, remove it first
  const existingIdx = backActionStack.findIndex((a) => a.id === id);
  if (existingIdx !== -1) {
    backActionStack.splice(existingIdx, 1);
  }

  backActionStack.push({ id, onBack });
  window.history.pushState({ appBackActionId: id }, '');
}

/**
 * Dismisses a back action if it was closed via UI (e.g. clicking 'X' or 'Cancel')
 * Reverts the history state so future back clicks remain synchronized
 */
export function dismissBackAction(id: string) {
  initPopStateListener();

  const idx = backActionStack.findIndex((a) => a.id === id);
  if (idx === -1) return;

  const isTop = idx === backActionStack.length - 1;
  backActionStack.splice(idx, 1);

  if (isTop) {
    isIgnoringPopState = true;
    window.history.back();
    setTimeout(() => {
      isIgnoringPopState = false;
    }, 120);
  }
}

/**
 * React hook to register a back action for a component, modal, or overlay.
 * Automatically handles push when active and dismissal when deactivated.
 */
export function useBackAction(
  condition: boolean,
  id: string,
  onBack: () => void
) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (condition) {
      pushBackAction(id, () => {
        onBackRef.current();
      });

      return () => {
        dismissBackAction(id);
      };
    }
  }, [condition, id]);
}

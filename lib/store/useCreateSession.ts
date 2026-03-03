"use client";

import { useSyncExternalStore } from "react";
import {
  getCreateSessionSnapshot,
  subscribeCreateSession,
  type CreateSessionState,
} from "./createSession";

export function useCreateSession(): CreateSessionState {
  return useSyncExternalStore(
    subscribeCreateSession,
    getCreateSessionSnapshot,
    getCreateSessionSnapshot
  );
}

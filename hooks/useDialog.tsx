'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type DialogOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type DialogState =
  | {
      mode: 'confirm';
      options: DialogOptions;
      resolve: (value: boolean) => void;
    }
  | {
      mode: 'alert';
      options: DialogOptions;
      resolve: () => void;
    }
  | null;

type DialogContextValue = {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: DialogOptions) => Promise<void>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);

  const confirm = useCallback(
    (options: DialogOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ mode: 'confirm', options, resolve });
      }),
    []
  );

  const alert = useCallback(
    (options: DialogOptions) =>
      new Promise<void>((resolve) => {
        setState({ mode: 'alert', options, resolve });
      }),
    []
  );

  const close = (confirmed: boolean) => {
    if (!state) return;
    if (state.mode === 'confirm') {
      state.resolve(confirmed);
    } else {
      state.resolve();
    }
    setState(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <Dialog
        open={state !== null}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
      >
        <DialogContent className="max-w-sm">
          {state && (
            <>
              <DialogHeader>
                <DialogTitle>{state.options.title}</DialogTitle>
                {state.options.description && (
                  <DialogDescription className="whitespace-pre-line">
                    {state.options.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              <DialogFooter className="flex flex-row gap-2 sm:justify-end">
                {state.mode === 'confirm' && (
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => close(false)}
                  >
                    {state.options.cancelText ?? '취소'}
                  </Button>
                )}
                <Button
                  className={
                    state.options.destructive
                      ? 'flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white'
                      : 'flex-1 sm:flex-none'
                  }
                  onClick={() => close(true)}
                >
                  {state.options.confirmText ?? '확인'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return ctx;
}

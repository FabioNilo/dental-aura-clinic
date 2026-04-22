import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

export const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
} as const;

export function TestMemoryRouter(props: MemoryRouterProps) {
  return <MemoryRouter future={routerFuture} {...props} />;
}

import { Suspense, type ComponentType, type ReactNode } from "react";
export function withSuspense<P extends object>(
  Inner: ComponentType<P>,
  fallback: ReactNode = null
) {
  function WithSuspense(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Inner {...props} />
      </Suspense>
    );
  }
  WithSuspense.displayName = `withSuspense(${
    Inner.displayName ?? Inner.name ?? "Component"
  })`;
  return WithSuspense;
}

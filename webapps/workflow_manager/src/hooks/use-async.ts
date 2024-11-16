import * as React from "react";

export const useAsync = (handler: () => Promise<void>) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const exec = React.useCallback(() => {
    void (async () => {
      try {
        setIsLoading(true);
        await handler();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [handler, setIsLoading]);

  return [isLoading, exec] as [boolean, () => void];
};

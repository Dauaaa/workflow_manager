import * as React from "react";

// Media query using equivalent to md: tailwind syntax
const MD_QUERY = "(min-width: 768px)";

export const useIsMobile = () => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(MD_QUERY);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches]);

  return !matches;
};

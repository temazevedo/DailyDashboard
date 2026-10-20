// fetchJson(url, fallback, options) resolves the parsed JSON body or throws
// one Error carrying the server's {"error": text}, else fallback (per-card
// wording stays at the call sites). Shape proven by TaskCard's original
// request() helper; network failures and non-JSON error bodies hit fallback.
export function fetchJson(url, fallback, options) {
  return fetch(url, options).then(
    (response) => {
      if (!response.ok) {
        return response
          .json()
          .catch(() => null)
          .then((problem) => {
            if (problem && problem.error) throw new Error(problem.error);
            throw new Error(fallback);
          });
      }
      return response.json();
    },
    () => {
      throw new Error(fallback);
    },
  );
}

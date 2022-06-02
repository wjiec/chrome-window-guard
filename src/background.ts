// see https://github.com/microsoft/TypeScript/issues/12167
// see https://www.typescriptlang.org/tsconfig#importHelpers
export {};

type GuardFunction = () => Promise<void>;

const serialization = (func: GuardFunction, delay: number): GuardFunction => {
  let hasMore = false;
  let running = false;

  const runnable = async (skippable?: boolean) => {
    if (running && !skippable) {
      hasMore = true;
      return;
    }

    try {
      running = true;
      await func();
      if (hasMore) {
        hasMore = false;
        setTimeout(() => runnable(true), delay);
      }
    } catch (ignored) {
    } finally {
      running = false;
    }
  };

  return runnable;
};

const NewTabUri = "chrome://newtab";

const windowGuard = serialization(async () => {
  const [tab, ...rest] = await chrome.tabs.query({
    currentWindow: true,
    windowType: "normal",
  });
  const onlyOneTab = rest === null || rest.length === 0;
  const isValidOnlyOneTab = onlyOneTab && tab.url !== "";
  const firstPinned = tab.pinned;
  const firstLoading = tab.status === "loading";
  const validFirstLoading = isValidOnlyOneTab && firstLoading;
  const firstIsNewTab = tab.url?.indexOf(NewTabUri) === 0;
  const firstIsLoadingNotNewTab = !firstIsNewTab && validFirstLoading;
  const firstNotLoadingNotNewTab = !firstIsNewTab && !validFirstLoading;
  const firstNotLoadingIsNewTab = firstIsNewTab && !validFirstLoading;
  const onlyOneLoadingNotNewTab = isValidOnlyOneTab && firstIsLoadingNotNewTab;
  const onlyOneNotNewTab = isValidOnlyOneTab && firstNotLoadingNotNewTab;
  const onlyOnePinnedNewTab = isValidOnlyOneTab && firstPinned;
  const moreThanTwoTab = rest !== null && rest.length >= 2;

  if (onlyOneLoadingNotNewTab || onlyOneNotNewTab) {
    await chrome.tabs.create({
      index: 0,
      pinned: true,
      active: false,
      url: NewTabUri,
    });
  }

  if (onlyOnePinnedNewTab && tab.id) {
    await chrome.tabs.update(tab.id, { pinned: false });
  }

  if (moreThanTwoTab && firstNotLoadingIsNewTab && firstPinned && tab.id) {
    await chrome.tabs.remove(tab.id);
  }
}, 100);

chrome.tabs.onCreated.addListener(windowGuard);
chrome.tabs.onUpdated.addListener(windowGuard);
chrome.tabs.onRemoved.addListener(windowGuard);
chrome.tabs.onAttached.addListener(windowGuard);
chrome.tabs.onDetached.addListener(windowGuard);

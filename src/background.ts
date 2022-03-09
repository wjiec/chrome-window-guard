// see https://github.com/microsoft/TypeScript/issues/12167
// see https://www.typescriptlang.org/tsconfig#importHelpers
export {};

const NewTabUri = "chrome://newtab";

type Event = Partial<chrome.tabs.TabChangeInfo> &
  Partial<chrome.tabs.TabRemoveInfo> &
  Partial<chrome.tabs.TabDetachInfo>;

const enum EventSource {
  UPDATED,
  REMOVED,
  DETACHED,
}

const keepWindowAlive = async (event: Event, source: EventSource) => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  if (tabs.length === 1) {
    if (tabs[0]?.url?.indexOf(NewTabUri) === 0 && tabs[0]?.id) {
      await chrome.tabs.update(tabs[0].id, { pinned: false });
    } else if (source !== EventSource.UPDATED || event?.status === "loading") {
      await chrome.tabs.create({
        index: 0,
        active: false,
        pinned: true,
        url: NewTabUri,
      });
    }
  }
};

chrome.tabs.onRemoved.addListener((_: number, event: chrome.tabs.TabRemoveInfo) =>
  keepWindowAlive(event, EventSource.REMOVED)
);
chrome.tabs.onUpdated.addListener((_: number, event: chrome.tabs.TabChangeInfo) =>
  keepWindowAlive(event, EventSource.UPDATED)
);
chrome.tabs.onDetached.addListener((_: number, event: chrome.tabs.TabDetachInfo) =>
  keepWindowAlive(event, EventSource.DETACHED)
);

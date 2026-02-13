import { searchIcon } from "../components/icons";

import { register } from "./register";

export const actionToggleSearchMenu = register({
  name: "searchMenu",
  icon: searchIcon,
  keywords: ["search", "find"],
  label: "search.title",
  viewMode: true,
  trackEvent: {
    category: "search_menu",
    action: "toggle",
    predicate: (appState) => appState.gridModeEnabled,
  },
  perform() {
    return false;
  },
  checked: () => false,
  predicate: () => false,
  keyTest: () => false,
});

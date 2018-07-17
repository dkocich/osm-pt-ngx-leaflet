export interface IRouteBrowserOptions {
  changeMembers: boolean;
  createRoute: boolean;
  membersEditing: boolean;
  toggleFilteredView: boolean;
}

export interface ITagBrowserOptions {
  allowedKeys?: string[];
  limitedKeys: boolean;
  makeKeysReadOnly: boolean;
}

// export interface ISuggestionsBrowserOptions {
//   name: boolean;
//   ref: boolean;
//
//
// }

export interface ISuggestionsBrowserOptions {
  nameSuggestions: ISuggestions;
  refSuggestions: ISuggestions;
}
export interface ISuggestions {
  found: boolean;
  startCorrection: boolean;
}

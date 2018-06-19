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

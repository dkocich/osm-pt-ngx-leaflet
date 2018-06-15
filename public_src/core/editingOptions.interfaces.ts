export interface IRouteBrowserOptions {
  createRoute: boolean;
  changeMembers: boolean;
  membersEditing: boolean;
  toggleFilteredView: boolean;
}

export interface ITagBrowserOptions {
  limitedKeys: boolean;
  allowedKeys?: string[];
  makeKeysReadOnly: boolean;
}

/* SystemJS module definition */
declare let module: INodeModule;

interface INodeModule {
  id: string;
}

declare module '*.json' {
  const value;
  export default value;
}

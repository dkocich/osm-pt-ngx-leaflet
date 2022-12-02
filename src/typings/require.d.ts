// webpack require() definition for ts-loader
// source: https://github.com/TypeStrong/ts-loader
declare let require: {
  <T>(path: string): T;
  (paths: string[], callback: (...modules) => void): void;
  ensure: (
    paths: string[],
    callback: (require: <T>(path: string) => T) => void
  ) => void;
};

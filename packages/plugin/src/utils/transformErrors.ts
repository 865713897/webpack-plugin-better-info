interface Error {
  message: string;
  moduleName?: string;
  stack?: string;
}

const isModuleBuildError = (error: Error): boolean => {
  return error.stack?.includes('ModuleBuildError') || error.stack?.includes('ModuleNotFoundError');
};

const cleanErrorMessage = (message: string): string => {
  return message
    .replace(/^Module build failed.*:\s/, '')
    .replace(/^SyntaxError:.*:\s/, '')
    .replace(/^\s*at\s.*:\d+:\d+\)?[\s]*$/gm, '')
    .replace(/^Module not found:\s/, '')
    .replace(/Error:|Caused by:|Syntax Error/g, '')
    .trim();
};

const cleanErrorModuleName = (moduleName: string): string => {
  return moduleName.replace(/^.*(?=\.\/src)/, '').replace(/\?.*/, '');
};

const transformBuildErrors = (error: Error): Error => {
  if (isModuleBuildError(error)) {
    error.message = cleanErrorMessage(error.message);
    error.moduleName = cleanErrorModuleName(error.moduleName);
  }
  return error;
};

export const transformErrors = (errors: Error[]): Error[] => {
  return errors.map(transformBuildErrors);
};

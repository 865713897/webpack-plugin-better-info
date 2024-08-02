export const transformBuildErrors = (error: any) => {
  return new Promise((resolve) => {
    const isModuleBuildError = error.stack?.includes('ModuleBuildError');
    if (isModuleBuildError) {
      error.message = error.message
        .replace(/^Module build failed.*:\s/, '')
        .replace(/^SyntaxError:.*:\s/, '')
        .replace(/^\s*at\s.*:\d+:\d+\)?[\s]*$/gm, '')
        .replace('Error:', '')
        .replace('Caused by:', '')
        .replace('Syntax Error', '')
        .trim();
    }
    resolve(error);
  });
};

export const transformErrors = async (errors: any[]) => {
  const tasks = errors.map(async (error) => {
    const transformedError = await transformBuildErrors(error);
    return transformedError;
  });
  const transformedErrors = await Promise.all(tasks);
  return transformedErrors;
};

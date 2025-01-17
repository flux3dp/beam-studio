const isWeb = (): boolean => Boolean(window?.FLUX?.version?.startsWith('web'));

export default isWeb;

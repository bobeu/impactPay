export const getEllipsisTxt = (str: string, n: number = 6): string => {
  if (str) {
    return `${str.substring(0, n)}...${str.substring(str.length - n, str.length)}`;
  }
  return "";
};

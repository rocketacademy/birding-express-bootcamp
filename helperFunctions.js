/* eslint-disable import/prefer-default-export */
export const upperCaseFirstLetter = (sentence) => {
  const upperFirstLetter = sentence.slice(0, 1).toUpperCase();
  return upperFirstLetter + sentence.slice(1, sentence.length);
};

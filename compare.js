import moment from 'moment';

/**
 * Function to compare strings.
 * @param {String} firstItemAttr First item.
 * @param {String} secondItemAttr Second item.
 * @param {String} sortOrder Sort order.
 * @returns 0 if equal, 1 if first item < second item, -1 otherwise.
 */
const compareStrings = (firstItemAttr, secondItemAttr, sortOrder) => {
  // get attributes to compare
  let firstItem = firstItemAttr;
  if (!Number.isInteger(firstItem)) {
    firstItem = firstItem.toUpperCase();
  }
  let secondItem = secondItemAttr;
  if (!Number.isInteger(secondItem)) {
    secondItem = secondItem.toUpperCase();
  }

  // return comparison result
  if (firstItem < secondItem) {
    return (sortOrder === 'desc') ? 1 : -1;
  }
  if (firstItem > secondItem) {
    return (sortOrder === 'desc') ? -1 : 1;
  }
  return 0;
};

/**
 * Function to compare dates.
 * @param {Date} firstItemAttr First item.
 * @param {Date} secondItemAttr Second item.
 * @param {String} sortOrder Sort order.
 * @returns 0 if equal, 1 if first item < second item, -1 otherwise.
 */
const compareDates = (firstItemAttr, secondItemAttr, sortOrder) => {
  // get attributes to compare
  const firstItem = moment(firstItemAttr);
  const secondItem = moment(secondItemAttr);

  // return comparison result
  if (firstItem.isBefore(secondItem)) {
    return (sortOrder === 'desc') ? 1 : -1;
  }
  if (firstItem.isAfter(secondItem)) {
    return (sortOrder === 'desc') ? -1 : 1;
  }
  return 0;
};

/**
 * Function to compare strings.
 * @param {Object} first First object.
 * @param {Object} second Second object.
 * @param {String} sortBy Field to sort by.
 * @param {String} sortOrder Sort order.
 * @returns 0 if equal, 1 if first item < second item, -1 otherwise.
 */
const compare = (first, second, sortBy, sortOrder) => {
  const firstItemAttr = first[sortBy] || '';
  const secondItemAttr = second[sortBy] || '';

  if (moment(firstItemAttr).isValid() && moment(secondItemAttr).isValid()) {
    return compareDates(firstItemAttr, secondItemAttr, sortOrder);
  }
  return compareStrings(firstItemAttr, secondItemAttr, sortOrder);
};

export { compare, compareDates, compareStrings };

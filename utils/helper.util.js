import jsSHA from 'jssha';
import pool from './dbConnect.js';

/**
 * Get hash value of a text.
 * @param {*} text Text to hash.
 * @returns Hash value of a text.
 */
export const getHashValue = (text) => {
  // eslint-disable-next-line new-cap
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(text);
  return shaObj.getHash('HEX');
};

/**
 * Check if user is logged in.
 * @returns True, if logged in. False, otherwise.
 */
export const isLoggedIn = (req) => (req.cookies && req.cookies.user);

/**
 * Get list of species.
 */
export const getSpecies = async () => {
  const query = 'select id, name, scientific_name from species order by name';

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.log('Error executing query', err.stack);
    return null;
  }
};

/**
 * Get list of behaviors.
 */
export const getBehaviors = async () => {
  const query = 'select id, behavior from behaviors';

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.log('Error executing query', err.stack);
    return null;
  }
};

/**
 * Get list of comments.
 */
export const getComments = async (notesID) => {
  const query = 'select c.id, c.text, c.date_time, u.email from comments c inner join users u on c.user_id=u.id where c.notes_id=$1 order by c.date_time desc';
  const inputData = [notesID];

  try {
    const result = await pool.query(query, inputData);
    return result.rows;
  } catch (err) {
    console.log('Error executing query', err.stack);
    return null;
  }
};

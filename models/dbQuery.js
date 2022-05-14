import pool from './dbConfig.js';

// const poolQueries = (sqlQuery, values, callback) => {
//   const handleQueryCallback = (err, results) => {
//     if (err) {
//       console.log(`ERROR IN handleQueryCallback ---> ${err}`);
//       callback(err, null);
//       return;
//     }

//     console.log(`SUCCESS IN handleQueryCallback ---> ${results}`);
//     console.log(results.rows);
//     callback(null, results.rows);
//   };

//   pool.query(sqlQuery, values, handleQueryCallback);
// };

const poolQueries = (sqlQuery, values, callback) => {
  pool.query(sqlQuery, values, (err, results) => {
    if (err) {
      console.log(`ERROR IN handleQueryCallback ---> ${err}`);
      callback(err, null);
    } else {
      console.log(`SUCCESS IN handleQueryCallback ---> ${results}`);
      console.log(results.rows);
      callback(null, results.rows);
    }
  });
};
export default poolQueries;

const db = require('knex')({
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      user : 'root',
      password : '',
      database : 'todo_list'
    }
  });
  
  const insertData = (tableName, data) => {
  
    return db(tableName)
            .insert(data)
            .then(resp => resp)
  }
  
  const selectData = (tableName, options = { fields: [], filteringConditions: [] }) => {
  
  const { fields, filteringConditions } = options
  
  return db(tableName)
          .select(fields)
          .where(builder => {
              filteringConditions.forEach(condition => {
                  builder.where(...condition)
              });
  
          })
          .then(data => data)
  }
  
  const updateData = (tableName, options = { fields: {}, filteringConditions: [] }) => {
  
  const { fields, filteringConditions } = options
  
  return db(tableName)
        .where(builder => {
            filteringConditions.forEach(condition => {
                builder.where(...condition)
            });
  
        })
        .update(fields)
        .then(data => data)
  }
  
  const deleteData = (tableName, options = { filteringConditions: [] }) => {
  
  const { filteringConditions } = options
  
  return db(tableName)
          .where(builder => {
              filteringConditions.forEach(condition => {
                  builder.where(...condition)
              });
  
          })
          .del()
          .then(data => data)
  }
  
  
  module.exports = {
  insertData,
  updateData,
  selectData,
  deleteData
  }
module.exports = instance => async (uri, params) =>
  new Promise((resolve, reject) => {
    instance
      .get(uri, params)
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        console.log(error)
        reject(error)
      })
  })

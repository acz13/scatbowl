const crypto = require('crypto')

function randomGuestID(byteLength) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(byteLength, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString('hex'));
      }
    })
  })
}

module.exports = randomGuestID
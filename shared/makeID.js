// Temporary library used for developing
// on a car with no internet access so I can't
// download uuid

// From stackoverflow somewhere... found in
// a previous project

export default function makeID (length) {
  var letters = '0123456789ABCDEF'
  var id = '#'
  for (var i = 0; i < 6; i++) {
    id += letters[Math.floor(Math.random() * 16)]
  }
  return id
}

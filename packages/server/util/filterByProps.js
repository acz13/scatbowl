// Credit to Clemens Helm
// https://stackoverflow.com/questions/38750705/filter-object-properties-by-key-in-es6/47443227#47443227

export default function filterByProps (allowed, raw) {
  return allowed
    .reduce((obj, key) => ({ ...obj, [key]: raw[key] }), {})
}

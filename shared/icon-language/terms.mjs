export function parseTerms(text) {
  const result = {};
  for (const pair of text.trim().split(/\s*\n\s*/).flatMap(line => line.split('|'))) {
    const fields = pair.split('='), [key, value] = fields;
    if (fields.length !== 2 || !key?.trim() || !value?.trim() || !/[가-힣]/u.test(value) || Object.hasOwn(result, key))
      throw Error('Empty, duplicate or untranslated Korean term: ' + key);
    result[key] = value;
  }
  return result;
}

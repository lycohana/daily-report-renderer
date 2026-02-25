function parseFormField(formValue) {
  if (!formValue) {
    return [];
  }

  const sources = formValue.split(',');

  return sources
    .map(source => {
      const sourceStr = source.trim();
      if (!sourceStr) {
        return { name: null, url: null };
      }

      if (sourceStr.includes('|')) {
        const parts = sourceStr.split('|');
        return {
          name: parts[0].trim(),
          url: parts[1] ? parts[1].trim() : null
        };
      }

      if (sourceStr.includes(' - ')) {
        const parts = sourceStr.split(' - ');
        return {
          name: parts[0].trim(),
          url: parts[1] ? parts[1].trim() : null
        };
      }

      return {
        name: sourceStr.trim(),
        url: null
      };
    })
    .filter(source => source.name !== null);
}

module.exports = {
  parseFormField
};

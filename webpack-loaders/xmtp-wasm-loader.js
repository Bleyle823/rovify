module.exports = function(source) {
  // Replace the 'wbg' import with a fallback
  const modifiedSource = source.replace(
    /import\s*\(\s*['"]wbg['"]\s*\)/g,
    'Promise.resolve({})'
  );
  
  // Also handle require statements
  const finalSource = modifiedSource.replace(
    /require\s*\(\s*['"]wbg['"]\s*\)/g,
    '{}'
  );
  
  return finalSource;
};

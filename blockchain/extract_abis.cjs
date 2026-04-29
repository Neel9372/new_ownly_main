const fs = require('fs');
const path = require('path');

const contracts = ['OwnlyProperty', 'MockINRC', 'OwnlyToken'];
const outDir = path.join(__dirname, '..', 'backend', 'contracts');

contracts.forEach(name => {
  const artifactPath = path.join(__dirname, 'artifacts', 'contracts', name + '.sol', name + '.json');
  const data = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const outPath = path.join(outDir, name + '.json');
  fs.writeFileSync(outPath, JSON.stringify({ abi: data.abi }, null, 2));
  console.log('Extracted ABI:', name, '->', outPath);
});

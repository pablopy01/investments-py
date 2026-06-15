// Script to convert PNG icon to ICO format for Windows
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const inputPng = path.join(__dirname, 'build', 'icon.png');
const outputIco = path.join(__dirname, 'build', 'icon.ico');

console.log('Converting PNG to ICO...');
console.log('Input:', inputPng);
console.log('Output:', outputIco);

pngToIco(inputPng)
  .then(buf => {
    fs.writeFileSync(outputIco, buf);
    console.log('✅ icon.ico created successfully!');
    console.log(`   Size: ${buf.length} bytes`);
  })
  .catch(err => {
    console.error('❌ Error converting icon:', err.message);
    process.exit(1);
  });

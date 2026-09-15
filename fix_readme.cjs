const fs = require('fs');
let md = fs.readFileSync('README.md', 'utf8');
md = md.replace('# ?? AlgoTrack', '<div align=\'center\'>\n  <img src=\'public/navbar_logo.svg\' width=\'100\' alt=\'AlgoTrack Logo\' />\n  <h1>AlgoTrack</h1>\n</div>\n');
fs.writeFileSync('README.md', md);

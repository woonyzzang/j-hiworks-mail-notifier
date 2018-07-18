// const path = require('path');
// const childProcess = require('child_process');
// const phantomjs = require('phantomjs-prebuilt');
// const binPath = phantomjs.path;
//
// const childArgs = [
//   path.join(__dirname, '_phantom.js')
// ];
//
// childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
//   console.log(stdout);
//   console.log(stderr);
// });

const phantomjs = require('phantomjs-prebuilt');
const program = phantomjs.exec('_phantom.js');

program.stdout.pipe(process.stdout);
program.stderr.pipe(process.stderr);
program.on('exit', (code) => {
  console.log(code);
});

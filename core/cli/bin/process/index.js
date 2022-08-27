const cp = require('child_process')
const path = require('path')

cp.exec('ls -al|grep index', function (err, stdout, stderr) {
  console.log(err, stdout, stderr)
})

cp.execFile(
  path.resolve(__dirname, 'test.shell'),
  ['-al', '-bl'],
  function (err, stdout, stderr) {
    // console.log(err, stdout, stderr)
  }
)

const child = cp.spawn(path.resolve(__dirname, 'test.shell'), ['-al', '-bl'], {
  cwd: process.cwd(),
  stdio: 'inherit'
})

// const c = cp.spawn('cnpm', ['install'], {})

// child.stdout.on('data', function (chunk) {
//   console.log(chunk.toString())
//   // child.disconnect()
// })

// const forkChild = cp.fork(path.resolve(__dirname, 'child.js'))
// forkChild.send('hello child', () => {
//   forkChild.disconnect()
// })
// console.log(process.pid)
// forkChild.on('message', (msg) => {
//   console.log(msg)
// })

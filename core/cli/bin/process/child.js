console.log('child process')
console.log(process.pid)

process.on('message', (msg) => {
  console.log(msg)
})

process.send('hello main process')

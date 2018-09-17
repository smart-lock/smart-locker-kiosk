// Specify app arguments
const exec = require('child_process').exec

const chromePath = `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome`
// exec(`${chromePath} --kiosk --app=http://localhost:8080`)
const c = exec('open -a "Google Chrome" --kiosk --app=http://localhost:8080')
c.on('data', (d) => {
  console.log(d)
})
const express = require('express')
const app = express()
const port = 7232

const cors = require('cors')
app.use(cors())

const proxy = require('http-proxy-middleware')

app.use('/api', proxy('https://www.quizdb.org/api', { changeOrigin: true }))
app.use('/', proxy('http://localhost:8080', {
    changeOrigin: true, hostRewrite: true, ws: true,
    onProxyRes(proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*' // add new header to response
        proxyRes.headers['Access-Control-Allow-Headers'] = '*'
    }
}))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
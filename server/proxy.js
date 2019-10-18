import express from 'express'

const app = express()
const port = 7232

import cors from 'cors'
app.use(cors())

import proxy from 'http-proxy-middleware'

app.use('/api', proxy('https://www.quizdb.org/api', { changeOrigin: true }))
app.use('/', proxy('http://localhost:8080', {
    changeOrigin: true, hostRewrite: true, ws: true,
    onProxyRes(proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*' // add new header to response
        proxyRes.headers['Access-Control-Allow-Headers'] = '*'
    }
}))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
import 'dotenv/config'
import express from 'express'
import https from 'https'
import httpProxy from 'http-proxy'
import path from 'path'
import cookieParser from 'cookie-parser'
import pm2 from 'pm2'

import { adminRouter } from '../admin/index'
import { apiRouter } from '../api/index'
import { hashPass } from '../helpers/crypto'
import { getAvailableDomains, getMappings } from '../lib/data'
import { setupAuth, isCorrectCredentials } from '../auth'
import { ProxyMapping } from '../types/general'
import { SNICallback } from '../helpers/SNICallback'

const cyan = '\x1b[36m\u001b[1m%s\x1b[0m'
const red = '\x1b[31m\u001b[1m%s\x1b[0m'
const errorMsg =
  'ERROR: App cannot be started because you must set an ADMIN password in the environment variable when running this app. Visit https://github.com/garageScript/myproxy#how-to-install'

const startAppServer = (
  port: string | number,
  adminPass: string
): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    if (!adminPass) {
      console.error(red, errorMsg)
      return reject(errorMsg)
    }

    const app = express()
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())
    app.use(express.static(path.join(__dirname, '../public')))
    app.use('/admin', adminRouter)
    app.use('/api', setupAuth(adminPass), apiRouter)
    app.set('view engine', 'ejs')
    app.set('views', path.join(__dirname, '../../views'))

    app.get('/', setupAuth(adminPass), (_, res) =>
      getAvailableDomains().length > 0
        ? res.render('client')
        : res.redirect('/admin')
    )
    app.get('/login', (req, res) => res.render('login', { error: '' }))

    app.post('/login', (req, res) => {
      if (isCorrectCredentials(req.body.adminPass, adminPass)) {
        res.cookie('adminPass', hashPass(adminPass), { httpOnly: true })
        return res.redirect('/admin')
      }

      return res.render('login', { error: 'Wrong Admin Password' })
    })

    app.get('/sshKeys', (req, res) => {
      res.render('sshKeys')
    })

    const server = app.listen(port, () => {
      console.log(cyan, `myProxy is running on port ${port}!`)
      resolve(server)
    })
  })
}

const startProxyServer = (): void => {
  const proxy = httpProxy.createProxyServer({})
  proxy.on('error', err => console.error('Proxy error', err))

  const server = https.createServer({ SNICallback }, (req, res) => {
    try {
      const mappings = getMappings()
      const { ip, port }: ProxyMapping =
        mappings.find(({ subDomain, domain }) => {
          return `${subDomain}.${domain}` === req.headers.host
        }) || {}
      if (!port || !ip) return res.end('Not Found')
      proxy.web(req, res, { target: `http://${ip}:${port}` }, err => {
        console.error('Error communicating with server', err)
        res.end(`Error communicating with server that runs ${req.headers.host}`)
      })
    } catch (err) {
      console.error('Error: proxy failed', err)
      return res.end(`Error: failed to create proxy ${req.headers.host}`)
    }
  })
  server.listen(443)

  pm2.list((err, processDescriptionList) => {
    if (err) console.log('pm2 Err', err)
    console.log('pm2 Err', err)
    console.log('processDescriptionList', processDescriptionList)
  })

  pm2.describe(0, (err, processDescription) => {
    console.log('err', err)
    console.log('processDescription', processDescription)
  })

  const httpApp = express()
  httpApp.get('/*', (req, res) => {
    const paramCheck = req.headers.host.split('?')[1]
    const params = paramCheck ? `?${paramCheck}` : ''
    res.redirect(`https://${req.headers.host}${req.path}${params}`)
  })
  httpApp.listen(80)
}

export { startProxyServer, startAppServer }

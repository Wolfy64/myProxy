import express from 'express'
import path from 'path'
const app = express()
const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../../src/views'))

app.get('/', (req, res) => res.render('index', { message: 'Hello World' }))

app.listen(port, () => console.log(`app listening on port ${port}!`))

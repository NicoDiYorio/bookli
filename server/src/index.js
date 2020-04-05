const path = require('path')

const morgan = require('morgan')
const express = require('express')
const bodyParser = require('body-parser')
const detectPort = require('detect-port')

const models = require('./models/index.js')
const bookRouter = require('./routes/book.js')
const clientFolder = path.resolve(__dirname, '..', '..', 'client')
const serverFolder = path.resolve(__dirname, '..', '..', 'server')

const inTest = process.env.NODE_ENV === 'test'

async function startServer(port=process.env.SERVER_PORT) {
    port = port || (await detectPort(3000))
    await models.createTables();

    const app = express()
    app.use(bodyParser.json())

    !inTest && app.use(morgan('dev'))

    app.use(express.static(path.resolve(clientFolder, 'src')));
    app.use(express.static(path.resolve(serverFolder, 'src')));
    app.use('/assets', express.static(path.resolve(clientFolder, 'assets')));
    app.use('/assets', express.static(path.resolve(serverFolder, 'assets')));

    // Rutas
    app.use('/api/v1/books', bookRouter)

    return new Promise(function (resolve) {
        const server = app.listen(port, function () {
            !inTest && console.log(`Server started on http://localhost:${port}`)

            const originalClose = server.close.bind(server)
            server.close = async (clearDB) => {
                if (inTest) {
                    await models.dropTables();
                }
                
                return new Promise(resolveClose => {
                    originalClose(resolveClose)
                })
            }

            resolve(server)
        });
    })
}

if (require.main === module) {
    startServer()
}

module.exports = startServer

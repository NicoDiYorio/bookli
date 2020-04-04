const path = require('path')

const morgan = require('morgan')
const express = require('express')
const bodyParser = require('body-parser')
const detectPort = require('detect-port')

const client = path.resolve(__dirname, '..', '..', 'client')

const inTest = process.env.NODE_ENV === 'test'

async function startServer(port=process.env.SERVER_PORT) {
    port = port || (await detectPort(3000))

    const app = express()
    app.use(bodyParser.json())

    !inTest && app.use(morgan('dev'))

    app.use(express.static(path.resolve(client, 'src')));
    app.use('/assets', express.static(path.resolve(client, 'assets')));

    return new Promise(function (resolve) {
        const server = app.listen(port, function () {
            !inTest && console.log(`Server started on http://localhost:${port}`)

            const originalClose = server.close.bind(server)
            server.close = async (clearDB) => {

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

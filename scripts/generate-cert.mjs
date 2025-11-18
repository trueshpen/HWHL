import fs from 'fs'
import path from 'path'
import selfsigned from 'selfsigned'

const CERT_DIR = path.resolve('cert')
const KEY_PATH = path.join(CERT_DIR, 'local-key.pem')
const CERT_PATH = path.join(CERT_DIR, 'local-cert.pem')

if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true })
}

const attrs = [{ name: 'commonName', value: 'localhost' }]
const options = {
  algorithm: 'sha256',
  days: 825,
  keySize: 2048,
  extensions: [
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      digitalSignature: true,
      keyEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
      ],
    },
  ],
}

console.log('Generating self-signed certificate for https://localhost:3000 ...')
const pems = selfsigned.generate(attrs, options)

fs.writeFileSync(KEY_PATH, pems.private, { encoding: 'utf-8' })
fs.writeFileSync(CERT_PATH, pems.cert, { encoding: 'utf-8' })

console.log(`\nCreated certificate files:`)
console.log(`  Key : ${KEY_PATH}`)
console.log(`  Cert: ${CERT_PATH}`)
console.log('\nImport the certificate into your trusted store for a warning-free experience.')


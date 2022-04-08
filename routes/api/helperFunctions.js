const fs = require('fs');
const rsa = require('js-crypto-rsa');
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient.create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https"
});

const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath);
    const filesAdded = await ipfs.add({ path: fileName, content: file }, {
        progress: (len) => console.log("Uploading file...", len)
    });
    const fileHash = filesAdded.cid;
    return fileHash;
}

async function encrypt(text, publicKey) {
        encryptedText=''
        await rsa.encrypt(
            Buffer.from(text),
            publicKey,
            'SHA-256',
            ).then((encrypted) => {
                encryptedText = encrypted;
        })
        return encryptedText;
}


async function decrypt(encrypted, key) {
    decryptedText = ''
    await rsa.decrypt(
        encrypted,
        key,
        'SHA-256',
      ).then((decrypted) => {
          decryptedText= decrypted
      });
      return Buffer.from(decryptedText).toString()
}
module.exports = {encrypt, decrypt, addFile}
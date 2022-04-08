const router = require('express').Router();
const ipfsClient = require('ipfs-http-client');
const fs = require('fs');
const ipfs = ipfsClient.create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https"
});
const axios = require('axios');
const FormData = require('form-data');
const {generateKeyPair} = require('crypto');
const { Blockchain, Users, User, Credential, Credentials } = require('../../ssidBlockchain');
const crypto = require('crypto');
const rsa = require('js-crypto-rsa');
const path = require('path');

const privateJwk = {
    kty: 'RSA',
    n: 't5KJzhggFGuIZP9CHZDVqGDQ47hdi7Vw1-t4OFEV15VkUILzO3kW0Ujrp2tZ_9hxueM7yyk5ArYmdfTj-cT-l6RPB_8cKGHbIec_A-VimTIgiGgN6ZdsXtgmfDZKECaLxj1AZStZx43G_wJ8cihl0Y_vuncmmqEzk8PpjGjJSFnNQ-AvI7dHdQQv8kRUtMM0ZpfEjBl9nwyyeBpgwcP0zH0AyeCbIh0uxlWbCTWuJBxAjht38ibtG-nelUYhscIuq8Nw6KEakTLToPLlJNYKShQVJ33Fr1QyRxfZRdd2PLGRR83QU2S0at4BPjql8iVAbzkRzp97quNFsO_IUK0f_Q',
    e: 'AQAB',
    d: 'J3bIS1ciZmFrtBKwGv0NAaK2pY34BlXeSXzknm7IHE2QgEJ2md2BS0K67oYElhzo7gZsz1MwX2XbRNZ9wC9acC0xlE2Ctye6XUKCaIsCtF5zYf_EpegYsxcSxvdA2tH-kIKQem9kYKMZGa9mI4CNywx_g_2jffCTzvt6FOZeB0BxZiGQ5rkReknlbrAIT3JXnv3veztl4u2FbR1v6Sg2jAYdBXqa_6DLmUd0m8Sbrjk2Am9ZDwyUjPO0EVftfe_gfhxYqdz9fBzkikGqMVRJfTN_a56WuyE3-vPfCbhvmTIWyQt89Re27DVMWne81FN7GYUAFYgDmLYm2jL1fRl0HQ',
    p: '7cSPxbqI_2KSsxGC7Z64FgQDfgoKsF39fgLf0CTidOedr4NrOvQbs6QtluIIcz3l1EIWe8axmWjXlgxwjMZBhLnQkUKkXV4HtKYcIbIpsRcbpDre7DUf0iQ69-XtGP1bHwejYsKFBw2h8YUK9_NCmvARKeKjoajfnscxRDc_oBM',
    q: 'xaYbrmXbL3_bhBldig4XWJQCnU3Wvppgb_14sDfaLq_k6b-yZpbsnhLIiKoNfyrz0zOFANm3lTGDZHq7-57RUEZ_Y05N3Nm6U6Jmm9rs1nlKFjLGhuF3foglbyVhcisCyoA6mXRe4vMUjJfg7LMqGiY_TFbACHAOvmaYWJlK4a8',
    dp: 'D8c0dz2aq7_h1ko6MwSOWL-pb6rA7NU_5iXQrmJUOMfJ-gSxj_b1A6XIdLPJNcSMxNoh3dLgpDqF2-o1adIaNPGTup_-gkekIUPIqB_Hjn3nEq3pbylTVEGdPCgg5MCjVFrQZ9RauY4ZCgr3IF8fM2Ls8KeejjLDrCixx0IXUcs',
    dq: 'lA5za_fG8lT_1nu90z3tBSCSuM1nUQ6JsTqZ3r9oBFMk0mkUNb9W7q65Y46nX5yIW6ybNGDjIbKeb3V1Pe7hcxXsNTKiJw8-gYoE_TlI8vyWn_xXNRDOl41bJWBGF-TaSWE3BF7k-XMH8K2RAx7PKhl-jyvo3Ck9Ein-c1gZfOc',
    qi: 'MdypcwhgKEQWlnOiv2ViwQRBYa-UxA79fVc2njINbDk2aLxYdPEJ5tUZvldbC57-EfgANU2UOi-OCgzgFYBFmNipci4aWwkMSosPed1Kxt0zkgHznqk2LfBU1Pus4jwLKSoI94w__3iz4cM6VOWIF2LiA1aBXR6tZICLGRyO7z8'
  }

const publicJwk = {
    kty: 'RSA',
    n: 't5KJzhggFGuIZP9CHZDVqGDQ47hdi7Vw1-t4OFEV15VkUILzO3kW0Ujrp2tZ_9hxueM7yyk5ArYmdfTj-cT-l6RPB_8cKGHbIec_A-VimTIgiGgN6ZdsXtgmfDZKECaLxj1AZStZx43G_wJ8cihl0Y_vuncmmqEzk8PpjGjJSFnNQ-AvI7dHdQQv8kRUtMM0ZpfEjBl9nwyyeBpgwcP0zH0AyeCbIh0uxlWbCTWuJBxAjht38ibtG-nelUYhscIuq8Nw6KEakTLToPLlJNYKShQVJ33Fr1QyRxfZRdd2PLGRR83QU2S0at4BPjql8iVAbzkRzp97quNFsO_IUK0f_Q',
    e: 'AQAB'
  }

const setDefaultAccount = async () => {
    var account = await web3.eth.getAccounts();
    web3.eth.defaultAccount = account[0];
}

router.get('/', async (req, res, next) => {
    return res.json("Hello World");
})

/*Register new user*/
router.post('/register', async (req, res, next) => {
    // const account = web3.eth.accounts.create();
        const {username} = req.body;
        let userPrivateKey, userPublicKey;
        rsa.generateKey(2048).then(async(key)=>{
            try{
                const {publicKey, privateKey} = key;
                userPublicKey = publicKey;
                userPrivateKey = privateKey;
                const id = AwesomeUsers.users.length;
                let newUser = new User(id, username,userPublicKey);   // check if user already exists;

                // Add transaction to blockchain
                const tx = AwesomeUsers.addUser(newUser);
                AwesomeCoin.addTransaction(tx);
                // console.log(AwesomeCoin.chain[0].data.length);
                
                // console.log(AwesomeUsers);
                fs.writeFileSync(`${username}public.pem`,Buffer.from(JSON.stringify(publicKey)))
                fs.writeFileSync(`${username}private.pem`,Buffer.from(JSON.stringify(privateKey)))

                return res.status(200).json({user:{...newUser,privateKey},success:true})
            }
            catch(e){
                return res.status(200).json({message:e.message, success:false})
            }
        })
   
    // crypto.generateKeyPair('rsa',{
    //         modulusLength: 4096,
    //         publicKeyEncoding:{
    //             type:'spki',
    //             format:'pem',
    //         },
    //         privateKeyEncoding:{
    //             type:'pkcs8',
    //             format:'pem',
    //             cipher:'aes-256-cbc',
    //             passphrase:'top-secret'
    //         }
    //     },(err,publicKey,privateKey)=>{
    //         userPublicKey = publicKey;
    //         userPrivateKey = privateKey;
    //         const id = AwesomeUsers.users.length;
    //         let newUser = new User(id, username,userPublicKey);
    //         // check if user already exists;
    //         AwesomeUsers.addUser(newUser);
    //         console.log(AwesomeUsers);
    //         return res.json({user:{...newUser,privateKey}})
    //     });
})

router.get('/privateKey',(req,res,next)=>{
    const filePath = path.join(__dirname,'../../private.pem');
    return res.sendFile(filePath);
})

/*  
    Login existing user
*/
router.post('/login', async (req, res, next) => {

    // require private key to login

    const username = req.body.username;
    const loginMessage = req.body.loginMessage;
    // console.log(username, privateKey)
    const user = AwesomeUsers.getUserByUsername(username);
    if(user){
        // const encryptedTest = await encrypt(loginTest, publicJwk); // replace with user.publicKey
        if(1==1){
            return res.status(200).json({user, success:true});
        }
        return res.status(200).json({success:false});
    }
    else{
        return res.status(200).json({success:false});
    }
})


/* Upload File to IPFS */
router.post('/upload', async (req, res, next) => {
    // upload any kind of files
    // add file hash to ethereum
    // console.log('filesss --------- ', req.files)
    const sender = req.body.sender;
    let fileObj = {};
    let fileSend = {};
    if (req.files.inputFile) {
        const file = req.files.inputFile;
        const fileName = file.name;
        const filePath = __dirname + "/img/" + fileName;

        file.mv(filePath, async (err) => {
            if (err) {
                // console.log("Error: failed to download file.");
                return res.status(500).send(err);
            }
            const fileHash = await addFile(fileName, filePath);
            // console.log("File Hash received -->", fileHash);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log("Error: Unable to delete file", err);
                }
            });
            fileObj = {
                file: file,
                name: fileName,
                path: filePath,
                hash: fileHash,
            }

            const assetHash = fileHash.toString();
            const metadataUrl = `https://ipfs.io/ipfs/${assetHash}`
            const recepientAddress = sender;

            try {
                // console.log({ recepientAddress, assetHash, metadataUrl });
                // console.log(sender);
                const user = AwesomeUsers.getUserById(sender)
                if (process.platform === "darwin") {
                    fileSend = {
                        name: fileName,
                        metadataUrl,
                        assetHash,
                    }
                }
                else {
                    fileSend = {
                        name: fileName,
                        metadataUrl,
                        assetHash
                    }
                }
                
                const encryptedFile = await encrypt(assetHash, user.publicKey)

                const credential = new Credential(AwesomeCredentials.credentials.length, encryptedFile, sender);
                
                // Change to automatically add transaction to blockchain
                const tx = AwesomeCredentials.addCredential(credential); // Add credential to list of all credentials
                user.addCredential(credential.id); // Add credentialId to user credentials
                
                AwesomeCoin.addTransaction(tx);
                // console.log(AwesomeCoin.chain[0].data);
            }
            catch (e) {
                console.log(e.message);
            }
            return res.json(fileSend);
        })
    }
})

/**
 * Transfer of Ownership
 * Input: tokenId
*/
router.post('/transfer', async (req, res, next) => {
    // To get tokenid of asset requirements: recepientAddress, assetHash?, metadataUrl
    const fromAddress = req.body.from;
    const toAddress = req.body.to;
    let credential = req.body.credential; // a credential is similar to a contract which can be created by different organization with different claims
    // console.log(tokenId,toAddress)

    try {
        const owner = AwesomeUsers.getUserByUsername(fromAddress);
        const receiver = AwesomeUsers.getUserByUsername(toAddress);
        // console.log(owner,receiver);
    
        // find credential in owners credentials
        credential = AwesomeCredentials.credentials[credential.credentialId];
        
        if(receiver){
            let encryptedCredentialData = credential.data;
            const tx = credential.transfer(receiver, owner, encryptedCredentialData);
            AwesomeCoin.addTransaction(tx);
            // ensure unit transaction
            
            // console.log(AwesomeCredentials);
            return res.status(200).json({success:'true'})
        }
        else{
            return res.status(200).json({success:'false'})
        }
    }
    catch (e) {
        console.log(e.message)
    }
})

router.get('/owner', async (req, res, next) => {
    // To get tokenid of asset requirements: recepientAddress, assetHash?, metadataUrl
    console.log('checker')
    // const fromAddress = req.body.from
    // const toAddress = req.body.to
    const tokenId = req.query.tokenId
    console.log(tokenId)

    const recepientAddress = web3.eth.defaultAccount;
    try {
        // const tokenId = await uniqueAssetDeployedContract.methods.awardItem(recepientAddress, assetHash, metadataUrl).call({ from: recepientAddress, gas: '1000000' })
        // console.log(tokenId.toNumber())
        // const tokens = await uniqueAssetDeployedContract.methods.name().call({ from: recepientAddress, gas: '1000000' });;
        const owner = await uniqueAssetDeployedContract.methods.ownerOf(tokenId).call({ from: recepientAddress, gas: '1000000' });;
        console.log(owner)
        // uniqueAssetDeployedContract.methods.transferFrom(owner,toAddress, tokenId).send({ from: owner, gas: '1000000' });
        // console.log(tokenTransfer)
        res.json({ owner })
    }
    catch (e) {
        console.log(e.message)
    }


    // try {

    // }
    // catch (error) {
    //     console.log(error.message);
    // }
})


router.get('/getByTokenId/:tokenId', async (req, res, next) => {
    const { tokenId } = req.params;
    console.log('check id', tokenId)
    const recepientAddress = web3.eth.defaultAccount;

    try {
        const tokenUri = await uniqueAssetDeployedContract.methods.tokenURIs(tokenId).call({ from: recepientAddress, gas: '1000000' });
        return res.status(200).json({ tokenUri });
    }
    catch (error) {
        console.log(error.message);
        return res.status(400).json({ tokenUri: null });
    }
})

/* 
    Add file to IPFS 
*/
const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath);
    const filesAdded = await ipfs.add({ path: fileName, content: file }, {
        progress: (len) => console.log("Uploading file...", len)
    });
    const fileHash = filesAdded.cid;
    return fileHash;
}

/* 
    Get File by CID -> Fetch directly from IPFS 
*/
router.get('/file/:cid', async (req, res, next) => {
    const { cid } = req.params;
    const result = await getData(cid);
    // console.log(result);
    return res.json({ file: result });
})

const getData = async (hash) => {
    const asyncitr = ipfs.cat(hash);
    let data = [];
    let count = 0;
    const file = writeDataToFile(asyncitr);
    // console.log(data);
    return file;
}

const writeDataToFile = async (asyncitr) => {
    getFilePath();
    const file = fs.createWriteStream(__dirname + '/img/' + 'me.doc'); // __dirname + '/img' + filename
    for await (const itr of asyncitr) {
        file.write(Buffer.from(itr));
    }
    file.end();
    return file;
}

router.get('/getFilesByUser',async(req,res,next)=>{
    const userId = req.query.userId;
    const user = await AwesomeUsers.getUserById(userId);
    decryptedCredentials = [];
    console.log(user);
    if(user.credentials.length>0){
        user.credentials.forEach(async(credentialId,index)=>{
            const credential = AwesomeCredentials.getCredentialById(credentialId);
            console.log(typeof(credential.data));
            decryptedCredentials.push({...credential,credentialId});
            if(index==user.credentials.length-1){
                console.log(decryptedCredentials);
                return res.status(200).json(decryptedCredentials)
            }
        })
    }
    else{
        return res.status(200).json(decryptedCredentials)
    }
})

router.get('/getUserByUsername',async(req,res,next)=>{
    console.log('getUserByUsername');
    const username = req.query.username;
    const user = await AwesomeUsers.getUserByUsername(username);
    if(user){
        return res.status(200).json({success:true, user});
    }
})

router.post('/getAllFiles', async (req, res, next) => {
    const { userId } = req.params;
    const userFiles = getUserFiles(userId);
    if (userFiles !== null) {
        return res.status(200).json({ files: userFiles });
    }
    else {
        return res.status(200).json({ files: null, message: 'User does not have any existing files' });
    }
});


const pinFileToIPFS = async () => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    var data = new FormData();
    var tokenId = null;

    data.append('file', fs.createReadStream(__dirname + '/img/me.png'));

    const res = await axios.post(url, data, {
        maxContentLength: "Infinity",
        headers: {
            "Content-Type": `multipart/form-data;boundary = ${data._boundary}`,
            pinata_api_key: pinataAPIKey,
            pinata_secret_api_key: pinataSecretKey
        }
    });
}

const algorithm = 'aes-256-cbc'; //Using AES encryption
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

//Encrypting text
async function encrypt(text, publicKey) {
//    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
//    let encrypted = cipher.update(text);
//    encrypted = Buffer.concat([encrypted, cipher.final()]);
//    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
    encryptedText=''
    await rsa.encrypt(
        Buffer.from(text),
        publicKey,
        'SHA-256', // optional, for OAEP. default is 'SHA-256'
        ).then((encrypted) => {
            encryptedText = encrypted;
    })
    return encryptedText;
}

// // Decrypting text
// async function decrypt(encrypted, privateKey) {
//     decryptedText = ''
//     await rsa.decrypt(
//         encrypted,
//         privateKey,
//         'SHA-256', // optional, for OAEP. default is 'SHA-256'
//       ).then((decrypted) => {
//           decryptedText= decrypted
//         // now you get the decrypted message
//       });
//       return Buffer.from(decryptedText).toString()
// //    let iv = Buffer.from(text.iv, 'hex');
// //    let encryptedText = Buffer.from(text.encryptedData, 'hex');
// //    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
// //    let decrypted = decipher.update(encryptedText);
// //    decrypted = Buffer.concat([decrypted, decipher.final()]);
// //    return decrypted.toString();
// }




// test();

module.exports = router;
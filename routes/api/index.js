const fs = require('fs');
const rsa = require('js-crypto-rsa');
const router = require('express').Router();
const {addFile, encrypt, decrypt} = require('./helperFunctions')
const { Blockchain, Users, User, Credential, Credentials } = require('../../ssidBlockchain');

/* --------------------------API Endpoints-------------------------- */

router.get('/', async(req,res,next)=>{
    return res.send('Server running')
})

// * Register
router.post('/register', async (req, res, next) => {
    const {username, walletAddress} = req.body;

    rsa.generateKey(2048).then(async(key)=>{
        try{
            const {publicKey, privateKey} = key;
            const id = AwesomeUsers.users.length;
            let newUser = new User(id, username, publicKey);   // check if user already exists;
            const tx = AwesomeUsers.addUser(newUser);          // Add user to users
            //  Create new transaction
            AwesomeCoin.addTransaction(tx);
            // fs.writeFileSync(`${username}public.pem`,Buffer.from(JSON.stringify(publicKey)))
            // fs.writeFileSync(`${username}private.pem`,Buffer.from(JSON.stringify(privateKey)))
            return res.status(200).json({user:{...newUser, walletAddress: walletAddress, privateKey},success:true})
        }
        catch(e){
            return res.status(200).json({message:e.message, success:false})
            }
        })
})

// * Login
router.post('/login', async (req, res, next) => {
    const {username, walletAddress, secretMessage} = req.body;
    try{
        const user = await AwesomeUsers.getUserByUsername(username);

        if(decrypt(secretMessage, user.publicKey)==="SecretLoginKey"){
            return res.status(200).json({user, success:true});
        }
        return res.status(200).json({message:'Incorrect Private Key',success:false});
    }
    catch(e){
        return res.status(200).json({message:e.message, success:false})
    }
})

// * Get credentials by User
router.get('/getFilesByUser',async(req,res,next)=>{
    let userCredentials = [];
    const userId = req.query.userId;
    try{
        const user = await AwesomeUsers.getUserById(userId);

        if(user.credentials.length>0){
            user.credentials.forEach(async(credentialId,index)=>{
                const credential = AwesomeCredentials.getCredentialById(credentialId);
                userCredentials.push({...credential,credentialId});
                if(index == user.credentials.length-1)
                {
                    return res.status(200).json({credentials:userCredentials,success:true})
                }
            })
        }
        else{
            return res.status(200).json({credentials:userCredentials, success:true})
        }
    }
    catch(e){
        return res.json({message:e.message, success:false})
    }
})

// * Upload Document
router.post('/upload', async (req, res, next) => {
    const { senderAddress } = req.body;
    let fileSend = {};

    try{
        if (req.files) {
            const file = req.files.inputFile;
            const fileName = file.name;
            const filePath = __dirname + fileName;
            file.mv(filePath, async (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                
                const fileHash = await addFile(fileName, filePath);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.log("Error: Unable to delete file", err);
                    }
                });
                const assetHash = fileHash.toString();
                const metadataUrl = `https://ipfs.io/ipfs/${assetHash}`
                try {
                    const user = await AwesomeUsers.getUserById(senderAddress)
        
                    const encryptedAssetHash = await encrypt(assetHash, user.publicKey)
                    const encryptedMetadataUrl = await encrypt(metadataUrl, user.publicKey)

                    fileSend = { name: fileName, encryptedMetadataUrl, encryptedAssetHash }

                    const credential = new Credential(AwesomeCredentials.credentials.length, fileSend, senderAddress);
                    const tx = AwesomeCredentials.addCredential(credential); // Add credential to list of all credentials

                    user.addCredential(credential.id); // Add credentialId to user credentials
                    AwesomeCoin.addTransaction(tx);
                    return res.json({credential, success:true});
                }
                catch (e) {
                    return res.json({message:e.message, success: false});
                }
            })
        }
        else{
            return res.status(200).json({message: 'Please upload a file', success: false});
        }
    }
    catch(e){
        return res.json({message:e.message, success: false});
    }
    
})

// * Fetch Credential By Id
router.get('/getCredential', async(req, res, next)=> {
    const {credentialId} = req.query;
    try{
        const credential = await AwesomeCredentials.getCredentialById(credentialId);
        return res.status(200).json({credential, success:true})
    }
    catch(e){
        return res.status(200).json({message:e.message, success:false})
    }
})

// * Transfer credential
router.post('/transfer', async (req, res, next) => {
    const {from:fromAddress, to:toAddress, credentialId} = req.body;
    
    try {
        const credential = await AwesomeCredentials.credentials[credentialId];
        const fromUser = await AwesomeUsers.getUserById(fromAddress);
        const toUser = await AwesomeUsers.getUserById(toAddress);
        
        if(credential){
            if(credential.owner == fromAddress){
                if(toUser){
                    let encryptedCredentialData = credential.data;
                    const tx = credential.transfer(fromUser, toUser, encryptedCredentialData);
                    AwesomeCoin.addTransaction(tx);
                    const transferredCredential = await AwesomeCredentials.credentials[credentialId];
                    return res.status(200).json({credential: transferredCredential, success:'true'})
                }
                else{
                    return res.status(200).json({message:`${fromAddress} does not exist`, success:false})
                }
            }
            else{
                return res.status(200).json({message:`${fromUser} does not have permission to transfer object`, success:false})
            }
        }
        else{
            return res.status(200).json({message:`credential does not exist`, success:false})
        }
    }
    catch (e) {
        return res.status(200).json({message: e.message, success:false})
    }
})

// * Revoke Credential
router.post('/revoke', async(req,res,next)=>{
    const {credentialId, senderAddress, reason} = req.body;

    try{
        const credential = await AwesomeCredentials.getCredentialById(credentialId);
        const ownerId = credential.owner;
        const user = await AwesomeUsers.getUserById(senderAddress)
        if(ownerId == senderAddress){
            credential.revokeCredential(reason)
            const revokedCredential = await AwesomeCredentials.getCredentialById(credentialId);
            return res.status(200).json({credential:revokedCredential, success:true})
        }
        else{
            return res.status(200).json({message:'User does not have the correct permissions', success:false})
        }
    }
    catch(e){
        return res.status(200).json({message:e.message, success:false})
    }
})

router.post('/addViewer', async(req,res,next)=>{
    const {credentialId, viewerId, senderId} = req.body;

    try{
        const credential = AwesomeCredentials.getCredentialById(credentialId);
        if(credential.owner == senderId){
            credential.viewers.append(viewerId)
        }
    }
    catch(e){
        return res.status(200).json({message:e.message, success:false})
    }
})
// TODO * Selective Disclosure

// * Start Blockchain and other storage units
let AwesomeCoin = new Blockchain();
let AwesomeUsers = new Users();
let AwesomeCredentials = new Credentials();

module.exports = router;
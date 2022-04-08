const crypto = require('crypto');

class Transaction{
    constructor(data, receiverKey, senderKey){
        this.id = crypto.createHash('sha256').update(JSON.stringify(data)).digest('base64') ;
        this.data = data;
        this.receiverKey = receiverKey;
        this.senderKey = senderKey;
        this.timestamp = Date.now();
    }    
}

class Credential{
    constructor(id, data, createdBy){
        this.id = id;
        this.createdBy = createdBy;
        this.data = data;
        this.owner = createdBy;
        this.ownershipHistory = [];
        this.revocationStatus = {valid:true, reason:null};
        this.createdAt = Date.now();
    }

    updateOwnershipHistory(){
        const transfer = {from:'', to:'', timestamp:''}
        this.ownershipHistory.push(transfer);
    }

    revokeCredential(reason){
        this.revocationStatus.valid = false;
        this.revocationStatus.reason = reason; 
    }

    transfer(from, to, encryptedCredentialData){
        to.addCredential(this.id);
        this.owner = to.id;
        this.data = encryptedCredentialData
        // if above step fails break out of if
        const credentialIndex = from.credentials.findIndex(async(credentialid)=>{
            credentialid == this.id
        });
        from.credentials.splice(credentialIndex,1);
        const transaction = new Transaction(`Transfer credential ${this.id}`,from.id, to.id);
        return transaction;
    }
}

class Credentials{
    constructor(){
        this.credentials = [];  
    }

    addCredential(credential){
        // Check if credential can be safely appended and isn't malicious
        this.credentials.push(credential);
        const transaction = new Transaction(`${credential.id} added`, credential.owner, '0');
        return transaction;
    }

    // Fetch credential by credentialID -> No transaction required
    getCredentialById(credentialId){
        const credential = this.credentials.find((credential)=>credential.id == credentialId)
        if(credential){
            return credential;
        }
        throw Error('Credential does not exist')
    }
}

class User{
    constructor(id, username, publicKey){
        this.id=id;
        this.username=username;
        this.publicKey = publicKey;
        this.credentials = [];
    }

    //keygen inbuilt into the blockchain?
    generateKeyPair(){
        crypto.generateKeyPair('rsa',{
            modulusLength: 4096,
            publicKeyEncoding:{
                type:'spki',
                format:'pem',
            },
            privateKeyEncoding:{
                type:'pkcs8',
                format:'pem',
                cipher:'aes-256-cbc',
                passphrase:'top-secret'
            }
        },(err,publicKey,privateKey)=>{
            this.publicKey = publicKey
        });
    }

    addCredential(credentialId){
        this.credentials.push(credentialId);
    }

    //update userInformation
}

class Users{
    constructor(){
        const userZero =this.createUserZero();
        this.users = [];
        this.users.push(userZero);
    }

    createUserZero(){
        const user = new User(0,'','');
        return user;
    }

    addUser(user){
        // check if user is valid
        const checkUser = this.users.findIndex((u)=>u.username==user.username || u.publicKey == user.publicKey);
        if(checkUser===-1){
            this.users.push(user);
            const transaction = new Transaction(`${user.id} PK:${user.publicKey} created`, user.publicKey, '0');
            return transaction;
        }
        else{
            throw Error(`user with username ${user.username} already exists`);
        }
    }

    getUserById(userId){
        const user = this.users.find((user)=>user.id==userId);
        if(user){
            return user;
        }
        else{
            throw Error('User does not exist')
        }
    }

    getUserByUsername(username){
        console.log(this.users, username)
        const user = this.users.find((user)=>user.username==username);
        if(user){
            return user
        }
        throw Error(`${username} not found`)
    }
}

class Block{
    constructor(id, previousHash){
        this.id = id;
        this.data = [];
        this.previousHash = previousHash;
        this.blockHash = this.generateHash();
    }

    getHash = () => {
        return this.blockHash;
    }

    getPreviousHash = () => {
        return this.previousHash;
    }

    generateHash = () => { 
        const hash = crypto.createHash('sha256').update(JSON.stringify(this.data)).digest('base64');
        return hash;
    }

    verifyBlock = () => { 
        return this.generateHash()==this.blockHash;
    }
    
    addTransaction = (tx) => {
        this.data.push(tx);
    }
}

class Blockchain{
    constructor(){
        const genesis = this.createGenesisBlock();
        this.chain = [];
        this.chain.push(genesis);
    }
    
    addBlock(data){
        let index = this.chain.length - 1;
        let latestBlock = this.getLatestBlock();
        let latestBlockHash = latestBlock.getHash();
        let newBlock = new Block(index, data, latestBlockHash)
        return newBlock
    }

    getLatestBlock(){
        return this.chain[this.chain.length-1];
    }
    
    isChainValid(){
        let chainLength = this.chain.length;
        for (let index = 0; index < chainLength; index++) {
            let currentBlock = this.chain[index];
            if(!currentBlock.verifyBlock()){
                return false;
            }
            if(index>=1){
                let previousBlock = this.chain[index-1];
                if(currentBlock.getPreviousHash()!==previousBlock.getHash()){
                    return false;
                }
            }
        }
        return true;
    }

    createGenesisBlock(){
        const txd = new Transaction('','0','0')
        const hash = crypto.createHash('sha256').update('0').digest('base64');
        const genesis = new Block(0,txd,hash);
        return genesis;
    }

    addTransaction = (tx) => {
        const latestBlock = this.getLatestBlock();
        latestBlock.addTransaction(tx);
    }
}


// Create dummy user 
// const user = new User(1,'Sid',''); //generate public and private key for user
// user.generateKeyPair();


// user.checkUsername();
// AwesomeUsers.addUser(user);
// const newUserTx = new Transaction(user.id,user.username,'')
// let data1Block = AwesomeCoin.addBlock(newUserTx);
// if(AwesomeCoin.isChainValid()){
//     AwesomeCoin.chain.push(data1Block)
// }
// console.log(user);

// Create dummy transaction
// const data1 = new Transaction('10','Joe', 'Sid');
// let data1Block = AwesomeCoin.addBlock(data1);
// if(AwesomeCoin.isChainValid()){
//     AwesomeCoin.chain.push(data1Block)
// }

// const data2 = new Transaction('1','Remi', 'Sid');
// const data2Block = AwesomeCoin.addBlock(data2);
// if(AwesomeCoin.isChainValid()){
//     AwesomeCoin.chain.push(data2Block)
// }

// let hackBlock = AwesomeCoin.getLatestBlock();
// hackBlock.data = new Transaction('1','Remi', 'Sid');
// hackBlock.data = new Transaction('1', 'Joe', 'Remi');

// Check if chain is valid
// console.log(AwesomeUsers);
// console.log(AwesomeCoin.chain[1].data); 


module.exports = {Blockchain: Blockchain, Users:Users, User:User, Credentials:Credentials, Credential:Credential};
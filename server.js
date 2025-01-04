const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const path = require('path');


const Web3 = require('web3');
const fs = require('fs');

// Initialize Express App
const app = express();
app.use(bodyParser.json());
// Connect to Ganache
const web3 = new Web3('http://localhost:7545');

// Load Contract ABIs and Addresses
const loadContract = (contractName) => {
    const contractJson = JSON.parse(fs.readFileSync(path.join(__dirname,'truffle', 'build/contracts', `${contractName}.json`), 'utf8'));
    const networkId = Object.keys(contractJson.networks)[0];
    const contractAddress = contractJson.networks[networkId].address;
    return new web3.eth.Contract(contractJson.abi, contractAddress);
};

const paymentProcessingContract = loadContract('Payment');
const penaltyContract = loadContract('Penalty');
const refundContract = loadContract('Refund');
const feeScheduleContract = loadContract('Schedule');
const auditContract = loadContract('Audit');

// Example: Log the contract addresses
console.log("Payment Processing Address:", paymentProcessingContract.options.address);
console.log("Penalty Contract Address:", penaltyContract.options.address);
console.log("Refund Contract Address:", refundContract.options.address);
console.log("Fee Schedule Contract Address:", feeScheduleContract.options.address);
console.log("Audit Contract Address:", auditContract.options.address);



const receiverAddress = '0xd7Cee047911a386496Ed50d712BcA8dff3FdE32A';













// Import mongoose


// Connect to the 'users' database for admin and student details
const usersDb = mongoose.createConnection('mongodb://localhost:27017/users', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

usersDb.on('connected', () => {
    console.log('Connected to the users database successfully');
});

usersDb.on('error', (err) => {
    console.error('Error connecting to the users database:', err);
});

// Connect to the 'central' database for transactions and other related data
const centralDb = mongoose.createConnection('mongodb://localhost:27017/central', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

centralDb.on('connected', () => {
    console.log('Connected to the central database successfully');
});

centralDb.on('error', (err) => {
    console.error('Error connecting to the central database:', err);
});


// Schemas for the 'users' database (admin and student details)
const adminSchema = new mongoose.Schema({
    username: String,
    password: String, // In a real app, you should hash the password
});

const studentSchema = new mongoose.Schema({
    username: String,
    password: Date, // In a real app, you should hash the password
});

const Admin = usersDb.model('Admin', adminSchema);
const Student = usersDb.model('Student', studentSchema);

// Schemas for the 'central' database (Transaction, Refund, Schedule)
const transactionSchema = new mongoose.Schema({
    transactionId: String,
    senderAddress: String,
    receiverAddress: String,
    amount: Number,
    status: String,
    hash: String,
    timestamp: { type: Date, default: Date.now }
});

const refundSchema = new mongoose.Schema({
    transactionId: { type: String},
    feeType: { type: String},
    refundAmount: { type: Number},
    PtransactionId: { type: String},
    refundReason: { type: String},
    senderAddress: { type: String},
    hash: { type: String},
    status: { type: String, default: 'pending' },  // New field for status
    timestamp: { type: Date, default: Date.now }
});

const scheduleSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    duedate: Date,
    hash: String,
    timestamp: { type: Date, default: Date.now }
});

const Transaction = centralDb.model('Transaction', transactionSchema, 'transactions');  // Explicit collection name
const Refund = centralDb.model('Refund', refundSchema, 'refunds');  // Explicit collection name
const Schedule = centralDb.model('Schedule', scheduleSchema, 'schedules');  // Explicit collection name


function generateTransactionHash(transactionData) {
    console.log("Original Transaction Data:", transactionData);

    // Remove undefined or null values
    const cleanedData = Object.fromEntries(
        Object.entries(transactionData).filter(([_, value]) => value !== undefined && value !== null)
    );
    console.log("Cleaned Data (no null/undefined):", cleanedData);

    // Normalize data types and sort keys
    const normalizedData = Object.keys(cleanedData)
        .sort()
        .reduce((acc, key) => {
            const value = cleanedData[key];
            acc[key] = typeof value === 'number' ? value.toString() : value.trim ? value.trim() : value;
            return acc;
        }, {});
    console.log("Normalized and Sorted Data:", normalizedData);

    // Convert to JSON string
    const jsonData = JSON.stringify(normalizedData);
    console.log("JSON String Used for Hashing:", jsonData);

    // Generate hash
    const hash = crypto.createHash('sha512').update(jsonData, 'utf8').digest('hex');
    console.log("Generated Hash:", hash);

    return hash;
}




app.use(express.static(path.join(__dirname, 'frontend')));

// Default route: serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Route for the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

// Route for the student page
app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'student.html'));
});


// Admin and Student login routes
app.post('/admin-login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username, password }); // You can replace with hashed password check
        if (admin) {
            res.status(200).json({ message: 'Admin login successful', role: 'admin' });
        } else {
            res.status(401).json({ message: 'Invalid admin credentials' });
        }
    } catch (error) {
        console.error('Error logging in as admin:', error);
        res.status(500).json({ message: 'Error logging in as admin' });
    }
});

app.post('/student-login', async (req, res) => {
    const { username, password } = req.body; // password is the birthdate from frontend
   console.log("request recived",username,password);
    try {
        const student = await Student.findOne({ username }); // Find student by username
        
        if (student) {
            // Convert the student's stored password (date) to 'YYYY-MM-DD' format
            const storedDate = student.password.toISOString().split('T')[0]; // Extract date part
            console.log(storedDate,password);
            // Compare the received password (birthdate) with the stored date
            if (storedDate === password) {
                res.status(200).json({ message: 'Student login successful', role: 'student' });
            } else {
                res.status(401).json({ message: 'Invalid student credentials' });
            }
        } else {
            res.status(401).json({ message: 'Student not found' });
        }
    } catch (error) {
        console.error('Error logging in as student:', error);
        res.status(500).json({ message: 'Error logging in as student' });
    }
});


app.post('/processpenalty', async (req, res) => {
    const { senderAddress, amount, feeType } = req.body;

    console.log("Precessing penalty : ", req.body)


        // Query the schedule database using the feeType
        const feeSchedule = await Schedule.findOne({ type: feeType });

        console.log(feeSchedule)

        if (!feeSchedule) {
            return res.status(400).json({ error: 'Fee type not found in schedule' });
        }
        

        // Convert the due date to timestamp
        const dueDate = feeSchedule.duedate; // Get dueDate in "DD/MM/YYYY"
        const DUE_DATE = Math.floor(new Date(dueDate).getTime() / 1000); // Convert to Unix timestamp

        console.log('Due Date in timestamp:', DUE_DATE);

    try {
        const finalAmount = await penaltyContract.methods
            .applyPenalty(DUE_DATE, amount)
            .call({ from: senderAddress });

        res.json({ finalAmount });
          console.log("Executed penalty")

    } catch (error) {
        console.error('Error in /processpenalty:', error);
        res.status(500).json({ message: 'Failed to process penalty.' });
    }
});

// 2. /processpayment Endpoint
app.post('/processpayment', async (req, res) => {
    const { senderAddress, finalAmount } = req.body;
    let UNIVERSITY_ADDRESS=receiverAddress;


    console.log("processing payment",senderAddress," ",UNIVERSITY_ADDRESS," ",finalAmount)
    try {
        const isValid = await paymentProcessingContract.methods.validateAmount(finalAmount)
        .call();
    

        if (isValid) {
            const transactionId = uuidv4(); 
            res.json({
                transactionId,
                receiverAddress: UNIVERSITY_ADDRESS,
            });
        } else {
            res.status(400).json({ message: 'Invalid transaction.' });
        }
    } catch (error) {
        console.error('Error in /processpayment:', error);
        res.status(500).json({ message: 'Failed to process payment.' });
    }
});



// 3. /logtransaction Endpoint
app.post('/logtransaction', async (req, res) => {
    const { transactionId, senderAddress, receiverAddress, amount, status } = req.body;

    try {

        

        const transactionData = { transactionId, senderAddress, receiverAddress, amount, status };
        const hash = generateTransactionHash(transactionData);

        
        console.log("loged :" ,transactionData," \n",hash );

        const estimatedGas = await auditContract.methods.logTransaction(transactionId, hash).estimateGas();
          console.log('Estimated Gas:', estimatedGas);
        const receipt = await auditContract.methods.logTransaction(transactionId, hash)
  .send({ from: senderAddress, gas: 300000 });  // Set a higher gas limit

        const newTransaction = new Transaction({
            transactionId,
            senderAddress,
            receiverAddress,
            amount,
            status,
            hash,
        });



        await newTransaction.save();

        res.json({ message: 'Transaction logged successfully.' });
    } catch (error) {
        console.error('Error in /logtransaction:', error);
        res.status(500).json({ message: 'Failed to log transaction.' });
    }
});




    
    // Refund request handler
    app.post('/processrefund', async (req, res) => {
        console.log("Refund request received");
    
        try {
            // Extract the necessary data from the request body
            const { feeType, refundAmount, PtransactionId, refundReason, senderAddress } = req.body;
    

            console.log("details of refund are :",req.body)
            console.log("Initial type of refundAmount: ", typeof refundAmount, "Value: ", refundAmount);

            // Convert refundAmount to an integer
               const integerRefundAmount = parseInt(refundAmount, 10); // Base 10 ensures decimal conversion
            console.log("Converted refundAmount type: ", typeof integerRefundAmount, "Value:", integerRefundAmount);

            // Check if the conversion is valid
            if (isNaN(integerRefundAmount)) {
                throw new Error("Invalid refundAmount. Please provide a valid integer.");
            }

            
            // Call the Refund Contract to validate the refund request
            
            
             // Call the `validateAmount` function from the contract
             const isValid = await refundContract.methods.validateAmount(integerRefundAmount).call();

    // Display the result
             console.log(`Is the amount valid? ${isValid}`);
            if (!isValid) {
            return res.status(400).json({ message: 'Refund request is invalid' });
            }



            // Generate a new unique transaction ID for the refund
            const newTransactionId = uuidv4();
    
            // Prepare the refund data object
            const refundData = { 

                transactionId: newTransactionId,
                feeType,
                refundAmount,
                PtransactionId,
                refundReason,
                senderAddress
            };
    
            // Generate the hash for the refund transaction
            const refundHash = generateTransactionHash(refundData);

    
            // Create the refund transaction object based on the schema
            const refundTransaction = new Refund({
                transactionId: newTransactionId,
                feeType,
                refundAmount,
                PtransactionId,
                refundReason,
                senderAddress,
                hash: refundHash,
            });
    
            // Save the refund transaction to the database
            await refundTransaction.save();
    
            // Send response with success message and the new transaction ID
            res.status(200).json({ message: 'Refund processed successfully', transactionId: newTransactionId });
        } catch (error) {
            console.error('Error processing refund:' , error);
            res.status(500).json({ message: 'Error processing refund' });
        }
    });
    




app.post('/fetchPaymentHistory', async (req, res) => {
    console.log("Fetching transactions for:", req.body);

    try {
        const { address } = req.body; // Get sender's address from the request body
      //  const senderAddress = address;
        let transactions;
        // Find all transactions for the sender's address

        if(address==receiverAddress)
        {
             
             transactions = await Transaction.find({});

        }
        else{
             transactions = await Transaction.find({senderAddress:address});
        }
        

        if (transactions.length > 0) {
            console.log("Transactions found:", transactions.length);
            res.status(200).json(transactions); // Send an array of transactions
        } else {
            res.status(404).json({ message: 'No transactions found for this address' });
        }
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({ message: 'Error fetching transaction history' });
    }
});




app.post('/updateSchedule', async (req, res) => {
    console.log("Received Schedule Update");

    try {
        const { type, amount, duedate } = req.body;
        fee=amount;

        // Validate and parse the date
        const parsedDueDate = new Date(duedate);
        if (isNaN(parsedDueDate.getTime())) {
            throw new Error("Invalid date format for duedate");
        }

        // Call the smart contract to validate and apply discount if applicable
        const feeType = type;  // "Tuition fee", "Sports fee", etc.
        const feeAmount = amount;

     // Example fee amount
        const gasLimit = 300000; // Example gas limit, adjust as needed
        const finalamt = await feeScheduleContract.methods.setContractsAndApplyDiscount(
            paymentProcessingContract.options.address, // Dynamically get the address from the contract instance
            feeAmount
        ).send({ from: receiverAddress });
       
       

        // Check if a schedule with the given type already exists
        const existingSchedule = await Schedule.findOne({ type: type });

        // Prepare the schedule data
        const scheduleData = { type:feeType, amount: finalamt, duedate: parsedDueDate};

        // Generate the schedule transaction hash (assuming you have this function)
        const scheduleHash = generateTransactionHash(scheduleData);

        // Create the schedule transaction object to store in the database
        const scheduleTransaction = new Schedule({
            type: type,
            amount: finalamt,
            duedate: parsedDueDate,
            hash: scheduleHash,
        });

        if (existingSchedule) {
            // If the schedule already exists, update it
            existingSchedule.amount = fee;
            existingSchedule.duedate = parsedDueDate;
            existingSchedule.hash = scheduleHash;
            

            await existingSchedule.save();
            return res.status(200).json({
                message: `Fee schedule for ${type} has been updated.`,
                
            });
        } else {
            // If no existing schedule, save a new schedule transaction to the database
            await scheduleTransaction.save();
            return res.status(200).json({
                message: `New fee schedule for ${type} has been created.`,
                
            });
        }
    } catch (error) {
        console.error('Error processing schedule:', error);
        res.status(500).json({ message: `Error processing schedule: ${error.message}` });
    }
});





app.post('/fetchrefund', async (req, res) => {

    
    try {
        const { address } = req.body;  // Get the sender address from the request body
        
        
        // Find all refund requests associated with the sender address


        let refunds;

        if(address==receiverAddress)
         {
            console.log("refund Fetch recived by admin",address)
            refunds = await Refund.find({});
         }
         else{
            console.log("refund Fetch recived by user",address)
            refunds = await Refund.find({ senderAddress: address });
         }

        if (refunds.length > 0) {
            res.status(200).json(refunds);  // Return the array of refunds
        } else {
            res.status(404).json({ message: 'No refund requests found for this address.' });
        }
    } catch (error) {
        console.error('Error fetching refund requests:', error);
        res.status(500).json({ message: 'Error fetching refund requests.' });
    }
});

app.post('/fetchschedule', async (req, res) => {

    console.log("Schedule Fetch recived")
    try {
        const { address } = req.body;  // Get the sender address from the request body
        
        
        // Find all refund requests associated with the sender address
        const refunds = await Schedule.find({});

        if (refunds.length > 0) {
            res.status(200).json(refunds);  // Return the array of refunds
        } else {
            res.status(404).json({ message: 'No refund requests found for this address.' });
        }
    } catch (error) {
        console.error('Error fetching refund requests:', error);
        res.status(500).json({ message: 'Error fetching refund requests.' });
    }
});







app.post('/verifyaudit', async (req, res) => {
    try {
        const { transactionId } = req.body;

        if (!transactionId) {
            return res.status(400).json({ message: 'Transaction ID is required' });
        }

        console.log('Searching for Transaction ID:', transactionId);

        const transaction = await Transaction.findOne({ transactionId });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const { senderAddress, receiverAddress, amount, status } = transaction;

        const transactionData = { transactionId, senderAddress, receiverAddress, amount, status };
        const transactionHash = generateTransactionHash(transactionData);

        console.log('Transaction Data:', transactionData, 'Generated Hash:', transactionHash);

        // Interact with the audit smart contract
        const isValid = await auditContract.methods
            .auditTransaction(transactionId, transactionHash)
            .call();

        if (isValid) {
            return res.status(200).json({ message: 'Transaction successfully verified by the audit contract.' });
        } else {
            return res.status(200).json({ message: 'Transaction verification failed. Mismatch found in audit logs.' });
        }
    } catch (error) {
        console.error('Error during audit verification:', error);
        return res.status(500).json({ message: 'Internal server error during audit verification.' });
    }
});







app.post('/refund/decision', async (req, res) => {
    const { refundId, status } = req.body;

    try {
        // Query the refund details from the database using the refundId

        console.log("Accepting/rejecting refund")
        const refundRequest = await Refund.findOne({ transactionId: refundId });

        if (!refundRequest) {
            return res.status(404).json({ message: 'Refund request not found' });
        }

        if (status === 'Accepted') {
            
            // Extract the necessary details
            const { refundAmount, senderAddress } = refundRequest;
             // Specify receiver address globally or retrieve it dynamically
             
            // Update the refund request status to 'Accepted'
            refundRequest.status = 'Accepted';
            await refundRequest.save();

            // Respond with refund details
               console.log("details sentback",refundRequest)
            return res.json({
                amount: refundAmount,
                receiverAddress:senderAddress
            });
        } else if (status === 'Rejected') {
            // Update the refund request status to 'Rejected'
            refundRequest.status = 'Rejected';
            await refundRequest.save();

            return res.json({ message: 'Refund request rejected successfully' });
        }
    } catch (error) {
        console.error('Error processing refund decision:', error);
        res.status(500).json({ message: 'Error processing refund decision' });
    }
});



// Express setup to serve frontend HTML files (index.html, admin.html, student.html)
// Frontend files should be placed in a "public" folder
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

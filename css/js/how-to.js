const NFT_ADDRESS = "0x9bB5fA84989Ca0dDa01ef64a40AC9eff753aB5e1"; //Mumbai Ball on mumbai
const TOKEN_ADDRESS = "0xe07D7B44D340216723eD5eA33c724908B817EE9D"; //USDT on mumbai
const MAX_MINT_AMOUNT = 10;
const CHAIN_ID = 80001;
const WHITELIST_COST = 0.0005 * 10 ** 18;

const sleep = (milliseconds) => {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

//Created check function to see if the MetaMask extension is installed
const isMetaMaskInstalled = () => {
  //Have to check the ethereum binding on the window object to see if it's installed
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};


//Basic Actions Section
const onboardButton = document.getElementById('connectButton');
const textInfo = document.getElementById("textInfo");
var chainId = 0;

const initialize = () => {
	
	//init
    const web3 = new Web3(window.ethereum);
	const HS_contract = new web3.eth.Contract(HS_abi, NFT_ADDRESS);	
	const Token_contract = new web3.eth.Contract(Token_abi, TOKEN_ADDRESS);	
  
	const MetaMaskClientCheck = () => {
	//Now we check to see if MetaMask is installed
	if (!isMetaMaskInstalled()) {
		//If it isn't installed we ask the user to click to install it
		onboardButton.innerHTML = 'Please install MetaMask!';
	} else {
		//If it is installed we change our button text
		onboardButton.innerHTML = 'connect';
		//When the button is clicked we call this function to connect the users MetaMask Wallet
		//onboardButton.onclick = onClickConnect;
	}
	};


	/********** CONNECT BUTTON ***************/
	onboardButton.onclick = async () => {

	if (onboardButton.innerHTML == "connect"){
		try {
			// Will open the MetaMask UI
			await ethereum.request({ method: 'eth_requestAccounts' });
			const accounts = await ethereum.request({ method: 'eth_accounts' });
			chainId = await ethereum.request({ method: 'eth_chainId' });
			// You should disable this button while the request is pending!
			onboardButton.disabled=true;

			/******** Display Chain id *********/
			if(chainId == CHAIN_ID ){ 
			onboardButton.innerHTML = "Approve";
			textInfo.innerHTML = "Then press APPROVE to allow to spend WETH."
			onboardButton.disabled=false;
			}
			else{ onboardButton.innerHTML = "use Mumbai"; }
			
		} catch (error) {console.error(error);}
	}
	else{
		if(chainId == CHAIN_ID){
			if (onboardButton.innerHTML == "Approve"){
				
				approveToken();
			}
			if (onboardButton.innerHTML == "Add me"){
				addMe();
			}
		}else{ onboardButton.innerHTML = "use Mumbai"; }
	}
	};

	/************ METAMASK EVENTS ***********/
	ethereum.on('chainChanged', (chainId) => {
	// Handle the new chain.
	// Correctly handling chain changes can be complicated.
	// We recommend reloading the page unless you have good reason not to.
	window.location.reload();
	});

	ethereum.on("accountsChanged", accounts => {
	if (accounts.length > 0)
		console.log(`Account connected: ${accounts[0]}`);
	else
		console.log("Account disconnected");
	});


	MetaMaskClientCheck();

	/***************** whitelist popolation ********************/
	const refreshSupply = () => {
		const addCost = 0.0005;
		const baseCost = 0.009;
		HS_contract.methods.getTotalSupply().call().then(async function (result) {
			const liveCostNow = parseFloat(( baseCost + addCost * parseInt(result)).toFixed(4));
			const liveCostLast = parseFloat((liveCostNow - addCost).toFixed(4));
			const liveCostNext = parseFloat((liveCostNow + addCost).toFixed(4));

			priceLast.innerHTML = "Last: " + liveCostLast + " WETH";
			priceNow.innerHTML = "NOW: " + liveCostNow + " WETH";
			priceNext.innerHTML = "Next: " + liveCostNext + " WETH";
			totalSupply.innerHTML = "MINTED " + result + "/1014";
		});
	};
	refreshSupply();

	/************************************ HYPER-MINT ***********************************/
	var clickCount=0;

	/*************** APPROVE TOKEN ****************/
	const approveToken = async () => {
		clickCount++;

		if( ethereum.selectedAddress.length > 0 && clickCount > 0 ){
			console.log("approve");

			const encodedFunction = web3.eth.abi.encodeFunctionCall(Token_approve_abi, [NFT_ADDRESS, WHITELIST_COST]);
		
			const transactionParameters = {
				to: TOKEN_ADDRESS,
				from: ethereum.selectedAddress,
				data: encodedFunction
			};          

			// txHash is a hex string
			// As with any RPC call, it may throw an error
			try {
				const txHash = await ethereum.request({
				method: 'eth_sendTransaction',
				params: [transactionParameters],
				});
				onboardButton.innerHTML = "wait tx...";	

				//WAITING FOR SUCCESS TX
				let txReceipt = null;
				while (txReceipt == null) { // Waiting expectedBlockTime until the transaction is mined
					txReceipt = await web3.eth.getTransactionReceipt(txHash);
					await sleep(2000)
				}
				if (txReceipt.status){
					onboardButton.innerHTML = "Add me";		
					textInfo.innerHTML = "Finally press ADD ME to be whitelisted."		
				}
				else{onboardButton.innerHTML = "error tx";}
			} catch (error){
				console.log(`Error: ${error.message}`);
			}
	
		} else{
			console.log("Error no address no mintAmount");
		}    		
		clickCount=0;
	};

	
	/********** WHITELIST ****************/
	const addMe = async () => {
	clickCount++;


	if( ethereum.selectedAddress.length > 0 && clickCount > 0 ){

		console.log("add me")
		const encodedFunction = web3.eth.abi.encodeFunctionCall(HS_whitelist_abi,[]);
		
		const transactionParameters = {
			to: NFT_ADDRESS,
			from: ethereum.selectedAddress,
			data: encodedFunction
		};              
		
		// txHash is a hex string
		// As with any RPC call, it may throw an error
		try {
			const txHash = await ethereum.request({
			method: 'eth_sendTransaction',
			params: [transactionParameters],
			});

			//WAITING FOR SUCCESS TX
			let txReceipt = null;
			while (txReceipt == null) { // Waiting expectedBlockTime until the transaction is mined
				txReceipt = await web3.eth.getTransactionReceipt(txHash);
				await sleep(2000)
			}

			//GET TOKEN ID FROM TX
			if (txReceipt.status){
				textInfo.innerHTML="Your tx has been confirmed! You are whitelisted.";
				console.log(txReceipt);		
			}
			else{onboardButton.innerHTML = "error tx";}

		} catch (error){
			console.log(`Error: ${error.message}`);;
		}
	} else{
		console.log("Error no address no mintAmount");
	}    
	clickCount=0;
	}
}

window.addEventListener('DOMContentLoaded', initialize)

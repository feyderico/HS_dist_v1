const NFT_ADDRESS = "0x9bB5fA84989Ca0dDa01ef64a40AC9eff753aB5e1"; //Mumbai Ball on mumbai
const TOKEN_ADDRESS = "0xe07D7B44D340216723eD5eA33c724908B817EE9D"; //USDT on mumbai
const MAX_MINT_AMOUNT = 10;
const CHAIN_ID = 80001;
//Basic Actions Section
const onboardButton = document.getElementById('connectButton');
const plusButton = document.getElementById('plusButton');
const minusButton = document.getElementById('minusButton');
const amountInput = document.getElementById('amountInput');
const img = document.getElementById("goal_img");
const refreshButton = document.getElementById("refreshButton");
const priceLast = document.getElementById("priceLast");
const priceNow = document.getElementById("priceNow");
const priceNext = document.getElementById("priceNext");
const totalSupply = document.getElementById("totalSupply");
const textInfo = document.getElementById("textInfo");
var downloadingImage = document.createElement('video');
var chainId = 0;
var mintAmount = 0;
var cost = 0;

const sleep = (milliseconds) => {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};


const initialize = () => {
	
	//init
    const web3 = new Web3(window.ethereum);
	const HS_contract = new web3.eth.Contract(HS_abi, NFT_ADDRESS);	
	const Token_contract = new web3.eth.Contract(Token_abi, TOKEN_ADDRESS);	
  
	const MetaMaskClientCheck = () => {
	if (!isMetaMaskInstalled()) {
		onboardButton.innerHTML = 'Please install MetaMask!';
	} else {
		onboardButton.innerHTML = 'connect';
	}
	};


	/********** CONNECT BUTTON ***************/
	onboardButton.onclick = async () => {
		if(onboardButton.innerHTML != "waiting tx..."){
			onboardButton.disabled=true;
		}

		if (onboardButton.innerHTML == "connect"){
			try {
				// Will open the MetaMask UI
				await ethereum.request({ method: 'eth_requestAccounts' });
				const accounts = await ethereum.request({ method: 'eth_accounts' });
				chainId = await ethereum.request({ method: 'eth_chainId' });

				/******** Display Chain id *********/
				if(chainId == CHAIN_ID ){ 
				onboardButton.innerHTML = "Approve";
				textInfo.innerHTML = "Then press APPROVE to allow to spend WETH."
				onboardButton.disabled=false;

				}
				else{ 
					onboardButton.innerHTML = "use Mumbai";
					onboardButton.disabled=false;
				}
				
			} catch (error) {console.error(error);}
		}
		else{
			if(chainId == CHAIN_ID ){
				if (onboardButton.innerHTML == "Approve"){
					approveToken();
				}
				if (onboardButton.innerHTML == "Hyper-Mint"){
					hyperMint();
				}
			}else{ onboardButton.innerHTML = "use Mumbai";
			console.log(clickCount);
			onboardButton.disabled=false;
			}
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

	/***************** REFRESH SUPPLY ********************/
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
			if(result < 1014){
				totalSupply.innerHTML = "MINTED " + (result - 1) + "/1014";
			}
			else{
				totalSupply.innerHTML = "SOLD OUT!";
			}

		});
	};
	refreshButton.onclick = refreshSupply();
	refreshSupply();

	/************************************ HYPER-MINT ***********************************/

	/*************** APPROVE TOKEN ****************/
	const approveToken = async () => {
		onboardButton.disabled=false;

		if( ethereum.selectedAddress.length > 0 ){
			console.log("approve");
		
			HS_contract.methods.getLiveCost().call().then(async function (result) {
				mintAmount = parseInt(amountInput.innerHTML);
				cost = BigInt(result) *  BigInt(parseInt(amountInput.innerHTML));

				const encodedFunction = web3.eth.abi.encodeFunctionCall(Token_approve_abi, [NFT_ADDRESS, cost]);
			
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
					onboardButton.innerHTML = "waiting tx...";	

					//WAITING FOR SUCCESS TX
					let txReceipt = null;
					while (txReceipt == null) { // Waiting expectedBlockTime until the transaction is mined
						txReceipt = await web3.eth.getTransactionReceipt(txHash);
						await sleep(2000)
					}
					if (txReceipt.status){
						onboardButton.innerHTML = "Hyper-Mint";		
						textInfo.innerHTML = "Finally press HYPER-MINT to get your " + mintAmount + " $HYPES."		
					}
					else{onboardButton.innerHTML = "error tx";}
				} catch (error){
					console.log(`Error: ${error.message}`);
				}
			});	
		} else{
			console.log("Error no address no mintAmount");
		}    		
	};

	/********** LOAD METADATA + VIDEO FROM IPFS *************/
	const get_img = async (tokenId) => {

	HS_contract.methods.tokenURI(tokenId).call().then( async function (result) {
		console.log(result);
		const json_URL = "https://ipfs.io/ipfs/" + result.substring(7);
		console.log(json_URL);
		img.src = "images/loading_space.mp4";

		try{
			$.getJSON(json_URL, function(data) {
				console.log("requesting ")
				var img_URL = data.image;

				//const image_URI = "https://ipfs.io/ipfs/" + img_URL.substring(7);
				console.log(image_URI);			
	
				textInfo.innerHTML = "Here is what you get:" + "<br>" +
										data.name + "<br>" +
										"Base Numbers: " + data.attributes[0].value + "<br>" +
										"Texture: " + data.attributes[1].value  + "<br>" +
										"Projection angle: " + data.attributes[2].value  + "<br>" +
										"Distortion: " + data.attributes[3].value  + "<br>" +
										"Scarcity: " + data.attributes[4].value + "<br>" +
										"I'm loading the video...";
	
				downloadingImage.onloadeddata = function() {
					console.log("video loaded")
					refreshSupply();
					img.src = this.src; 
					textInfo.innerHTML = "Here is what you get:" + "<br>" +
										data.name + "<br>" +
										"Base Numbers: " + data.attributes[0].value + "<br>" +
										"Texture: " + data.attributes[1].value  + "<br>" +
										"Projection angle: " + data.attributes[2].value  + "<br>" +
										"Distortion: " + data.attributes[3].value  + "<br>" +
										"Scarcity: " + data.attributes[4].value + "<br>" +
										"Done! More info on OpenSea";
				};			
				downloadingImage.src = image_URI;
			});
		}catch(error){
			console.log(`Error: ${error.message}`);
			textInfo.innerHTML = "Sorry, something goes wrong, check on OpenSea.";
		}	
	});		
	}

	/********** SEND MINT TRANSACTION AND CATCH EVENTS ****************/
	const hyperMint = async () => {
	var requested = false;
	var tokenId = [];
	console.log(cost);
	console.log(mintAmount);
	onboardButton.disabled=false;

	if( ethereum.selectedAddress.length > 0 && mintAmount > 0 && cost > 0){

		console.log("hyper-mint")
		const encodedFunction = web3.eth.abi.encodeFunctionCall(HS_mint_abi, [mintAmount]);
		
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
			onboardButton.innerHTML = "waiting tx...";	

			//WAITING FOR SUCCESS TX
			let txReceipt = null;
			while (txReceipt == null) { // Waiting expectedBlockTime until the transaction is mined
				txReceipt = await web3.eth.getTransactionReceipt(txHash);
				await sleep(2000)
			}

			//GET TOKEN ID FROM TX
			if (txReceipt.status){
				textInfo.innerHTML="Your tx has been confirmed! Add $HYPES to your wallet: " + NFT_ADDRESS + "." + " You can wait your Hyper-Spaces here or on OpenSea.";
				onboardButton.innerHTML = "Approve";	

				console.log(txReceipt);		
				//let logLen = txReceipt.logs.length;
				//for(i=2;i<logLen-1;i++){
					tokenId.push(parseInt(txReceipt.logs[2].topics[3],16));
				//}
			}
			else{onboardButton.innerHTML = "error tx";}

		} catch (error){
			console.log(`Error: ${error.message}`);;
		}
	} else{
		console.log("Error no address no mintAmount");
	}    

	//REQUEST FROM IPFS
	if (!requested){
		console.log("request: " + String(tokenId))
		//for(i=0;i<tokenId.length;i++){
			get_img(tokenId[0]);
		//}
		requested = true;
	}
	}

	plusButton.onclick = () => {
		const mintAmount = parseInt(amountInput.innerText);
		if (mintAmount < MAX_MINT_AMOUNT){
			amountInput.innerHTML = mintAmount + 1
		}
	};
	
	minusButton.onclick = () => {
		const mintAmount = parseInt(amountInput.innerText);
		if (mintAmount > 1){
			amountInput.innerHTML = mintAmount - 1
		}
	};
}

window.addEventListener('DOMContentLoaded', initialize)

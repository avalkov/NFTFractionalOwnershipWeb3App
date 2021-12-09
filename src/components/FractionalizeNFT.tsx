import React from 'react'
import Popup from 'reactjs-popup'
import styled from 'styled-components'
import { parseEther, formatEther, parseUnits } from '@ethersproject/units';
import Web3 from 'web3';
import { getContract } from '../helpers/ethers'
import { bigNumberArrayToStrArray, arraysEqual, truncateAfterDecimal, 
    showNotification, NOTIFICATION_SUCCESS, NOTIFICATION_ERROR} from '../helpers/utilities'
import Button from './Button'
import FractionalizePopup from './FractionalizePopup'
import BuyFractionsPopup from './BuyFractionsPopup';

import SimpleNFT from 'contracts/SimpleNFT.sol/SimpleNFT.json'
import _FractionalizeNFT from 'contracts/FractionalizeNFT.sol/FractionalizeNFT.json'
import ERC20 from '../abi/ERC20.json'


const SImg = styled.img`
    width: 100px;
    height: 100px;
    margin-left: 10px;
`

const SSelectedImg = styled.img`
    width: 100px;
    height: 100px;
    padding: 5px;
    border: 2px solid #555;
    margin-left: 10px;
`

const SButtonDelimeter = styled.span`
    margin-left: 5px;
`

const SBalanceDetails = styled.div`
    margin-bottom: 30px;
`

interface IDepositedNFT {
    tokenID: string,
    uniqueTokenID: string,
}

interface IFractionizedNFT {
    depositedNFT: IDepositedNFT,
    fractionsTotalSupply: number,
    availableFractions: number,
    weiPricePerToken: string,
    forSale: boolean,
    soldOut: boolean,
    owner: string,
    fractionsContract: string,
}

interface IBoughtFraction {
    amount: number,
    nft: IFractionizedNFT,
}

interface IFractionalizeNFTProps {
    fractionalizationProtocolContractAddress: string,
    nftsContractAddress: string,
    library: any,
    account: string,
}

interface IFractionalizeNFTState {
    selectedWalletTokenID: string,
    userWalletNFTsIDs: string[],
    selectedDepositedUniqueTokenID: string,
    depositedNFTs: IDepositedNFT[],
    fractionalizedNFTs: IFractionizedNFT[],
    selectedBoughtFractionsUniqueID: string,
    boughtFractions: IBoughtFraction[],
    selectedNFTForSaleUniqueTokenID: string,
    selectedNFTForSalePricePerToken: string,
    allNFTsForSale: IFractionizedNFT[],
    nftsImages: string[],
    forceUpdate: number,
}

const INITIAL_STATE: IFractionalizeNFTState = {
    selectedWalletTokenID: '0',
    userWalletNFTsIDs: [],
    selectedDepositedUniqueTokenID: '0',
    depositedNFTs: [],
    fractionalizedNFTs: [],
    selectedBoughtFractionsUniqueID: '0',
    boughtFractions: [],
    selectedNFTForSaleUniqueTokenID: '0',
    selectedNFTForSalePricePerToken: '0',
    allNFTsForSale: [],
    nftsImages: [],
    forceUpdate: 1
}


const parseDepositedNFT = (entry: any) => {
    return {
        tokenID: entry.token.tokenId.toString(),
        uniqueTokenID: entry.token.uniqueTokenId.toString()
    }
}

const parseDepositedNFTs = (entries: any[]) => {
    const parsedDepositedNFTs : any[] = []
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        if (entry.fractionalized === false) {
            parsedDepositedNFTs.push(parseDepositedNFT(entry))
        }
    }
    return parsedDepositedNFTs
}

const parseFractionalizedNFT = (entry: any) => {
    return {
        fractionsTotalSupply: entry.token.fractionsTotalSupply.toString(),
        availableFractions: entry.token.availableFractions.toString(),
        weiPricePerToken: entry.token.weiPricePerToken.toString(),
        forSale: entry.token.forSale,
        soldOut: entry.token.soldOut,
        owner: entry.token.owner,
        fractionsContract: entry.token.fractionsContract,
        depositedNFT: parseDepositedNFT(entry)
    }
}

const parseFractionalizedNFTs = (entries: any[]) => {
    const parsedFractionalizedNFTs : any[] = []
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        if (entry.fractionalized === true) {
            parsedFractionalizedNFTs.push(parseFractionalizedNFT(entry))
        }
    }
    return parsedFractionalizedNFTs
}

const parseUserBoughtFraction = (entry: any) => {
    return {
        amount: entry.amount.toString(),
        nft: parseFractionalizedNFT(entry)
    }
}

const parseUserBoughtFractions = (entries: any[]) => {
    const parsedUserBoughtFractions : any[] = []
    for (let i = 0; i < entries.length; i++) {
        parsedUserBoughtFractions.push(parseUserBoughtFraction(entries[i]))
    }
    return parsedUserBoughtFractions
}

const parseNFTForSale = (entry: any) => {
    return {
        fractionsTotalSupply: entry.fractionsTotalSupply.toString(),
        availableFractions: entry.availableFractions.toString(),
        weiPricePerToken: entry.weiPricePerToken.toString(),
        forSale: entry.forSale,
        soldOut: entry.soldOut,
        depositedNFT: {
            tokenID: entry.tokenId.toString(),
            uniqueTokenID: entry.uniqueTokenId.toString()
        }
    }
}

const parseNFTsForSale = (entries: any[], account: string) => {
    const parsedNFTsForSale : any[] = []
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        if (entry.owner.toLowerCase() === account.toLowerCase()) {
            continue
        }
        parsedNFTsForSale.push(parseNFTForSale(entry))
    }
    return parsedNFTsForSale
}

const FractionalizeNFT = (props: IFractionalizeNFTProps) => {
    const [state, setState] = React.useState<IFractionalizeNFTState>({...INITIAL_STATE})
    const [fractionalizePopup, setFractionalizePopup] = React.useState(false)
    const [buyFractionsPopup, setBuyFractionsPopup] = React.useState(false)
    const [balance, setBalance] = React.useState('0')
    const [profit, setProfit] = React.useState('0')

    const forceUpdate = () => {
        setState({...state, forceUpdate: state.forceUpdate + 1})
    }
    
    const simpleNFTContract = getContract(props.nftsContractAddress, SimpleNFT.abi, props.library, props.account)
    const fractionalizeNFTContract = getContract(props.fractionalizationProtocolContractAddress, _FractionalizeNFT.abi, props.library, props.account)
    
    React.useEffect(() => {
        async function fetchData() {
            let newState : any = {}

            // Fetch user wallet NFTs and their images
            let walletNFTsIDs = await simpleNFTContract.getTokenIds()
            walletNFTsIDs = bigNumberArrayToStrArray(walletNFTsIDs)
            
            if (!arraysEqual(walletNFTsIDs, state.userWalletNFTsIDs)) {
                const urls = {}
                for (let i = 0; i < walletNFTsIDs.length; i++) {
                    urls[walletNFTsIDs[i]] = await simpleNFTContract.tokenURI(walletNFTsIDs[i])
                }
                newState = {...newState, userWalletNFTsIDs: walletNFTsIDs, nftsImages: urls}
            }

            // Fetch user deposited NFTs
            const userNFTs = await fractionalizeNFTContract.getUserNFTs()

            // Parse user deposited NFTs
            const parsedDepositedNFTs = parseDepositedNFTs(userNFTs)

            if (!arraysEqual(parsedDepositedNFTs, state.depositedNFTs)) {
                const urls = {}
                for (let i = 0; i < parsedDepositedNFTs.length; i++) {
                    urls[parsedDepositedNFTs[i].uniqueTokenID] = await simpleNFTContract.tokenURI(parsedDepositedNFTs[i].tokenID)
                }
                newState = {...newState, depositedNFTs: parsedDepositedNFTs, nftsImages: {...newState.nftsImages, ...urls}}
            }

            // Parse user fractionalized NFTs for sale
            const parsedFractionalizedNFTs = parseFractionalizedNFTs(userNFTs)

            if (!arraysEqual(parsedFractionalizedNFTs, state.fractionalizedNFTs)) {
                const urls = {}
                for (let i = 0; i < parsedFractionalizedNFTs.length; i++) {
                    urls[parsedFractionalizedNFTs[i].depositedNFT.uniqueTokenID] = await simpleNFTContract.tokenURI(
                        parsedFractionalizedNFTs[i].depositedNFT.tokenID)
                }
                newState = {...newState, fractionalizedNFTs: parsedFractionalizedNFTs, nftsImages: {...newState.nftsImages, ...urls}}
            }

            // Fetch user bought fractions and their images
            const userBoughtFractions = await fractionalizeNFTContract.getUserBoughtFractions()

            const parsedUserBoughtFractions = parseUserBoughtFractions(userBoughtFractions)

            if (!arraysEqual(parsedUserBoughtFractions, state.boughtFractions)) {
                const urls = {}
                for (let i = 0; i < parsedUserBoughtFractions.length; i++) {
                    urls[parsedUserBoughtFractions[i].nft.depositedNFT.uniqueTokenID] = await simpleNFTContract.tokenURI(
                        parsedUserBoughtFractions[i].nft.depositedNFT.tokenID)
                }
                newState = {...newState, boughtFractions: parsedUserBoughtFractions, nftsImages: {...newState.nftsImages, ...urls}}
            }

            // Fetch NFTs for sale and their iamges
            const nftsForSale = await fractionalizeNFTContract.getAllNFTsForSale()
            const parsedNFTsForSale = parseNFTsForSale(nftsForSale, props.account)

            if (!arraysEqual(parsedNFTsForSale, state.allNFTsForSale)) {
                const urls = {}
                for (let i = 0; i < parsedNFTsForSale.length; i++) {
                    const uniqueTokenId = parsedNFTsForSale[i].depositedNFT.uniqueTokenID
                    if (uniqueTokenId in urls) {
                        continue
                    }
                    urls[uniqueTokenId] = await simpleNFTContract.tokenURI(parsedNFTsForSale[i].depositedNFT.tokenID)
                }
                newState = {...newState, allNFTsForSale: parsedNFTsForSale, nftsImages: {...newState.nftsImages, ...urls}}
            }
            
            // Update state if something changed
            if (Object.keys(newState).length > 0) {
                setState({...state, ...newState})
            }
        }
    
        fetchData().catch((e) => {
            showNotification("Failed to fetch user data.", NOTIFICATION_ERROR)
        })

        async function fetchBalance() {
            const web3 = new Web3(props.library.provider);
            setBalance(truncateAfterDecimal(formatEther(await web3.eth.getBalance(props.account)), 4))
        }

        fetchBalance().catch(() => {
            showNotification("Failed to fetch user balance.", NOTIFICATION_ERROR)
        })

        async function fetchProfit() {
            setProfit(truncateAfterDecimal(formatEther(await fractionalizeNFTContract.getUserProfit()), 4))
        }

        fetchProfit().catch(() => {
            showNotification("Failed to fetch user profit.", NOTIFICATION_ERROR)
        })
    })

    // Prepare user wallet NFTs items
    const userWalletNFTsItems = []

    const onClickWalletNFT = (tokenId: any) => {
        if (state.selectedWalletTokenID === tokenId) {
            setState({...state, selectedWalletTokenID: '0'})
            return
        }

        setState({...state, selectedWalletTokenID: tokenId})
    }

    for (let i = 0; i < state.userWalletNFTsIDs.length; i++) {
        const tokenId = state.userWalletNFTsIDs[i]
        
        if (state.selectedWalletTokenID === tokenId) {
            userWalletNFTsItems.push(<SSelectedImg key={i} src={state.nftsImages[tokenId]} 
                onClick={() => { onClickWalletNFT(tokenId) }} />)
            continue
        }

        userWalletNFTsItems.push(<SImg key={i} src={state.nftsImages[tokenId]} 
            onClick={() => { onClickWalletNFT(tokenId) }} />)
    }

    // Prepare deposited NFTs items
    const depositedNFTsItems = []

    const onClickDepositedNFT = (uniqueTokenId: any) => {
        if (state.selectedDepositedUniqueTokenID === uniqueTokenId) {
            setState({...state, selectedDepositedUniqueTokenID: '0'})
            return
        }

        setState({...state, selectedDepositedUniqueTokenID: uniqueTokenId})
    }

    for (let i = 0; i < state.depositedNFTs.length; i++) {
        const uniqueTokenId = state.depositedNFTs[i].uniqueTokenID

        if (state.selectedDepositedUniqueTokenID === uniqueTokenId) {
            depositedNFTsItems.push(<SSelectedImg key={i} src={state.nftsImages[uniqueTokenId]} 
                onClick={() => { onClickDepositedNFT(uniqueTokenId) }} />)
            continue
        }

        depositedNFTsItems.push(<SImg key={i} src={state.nftsImages[uniqueTokenId]} 
            onClick={() => { onClickDepositedNFT(uniqueTokenId) }} />)
    }

    // Prepare fractionalized NFTs items
    const fractionalizedNFTsItems = []

    for (let i = 0; i < state.fractionalizedNFTs.length; i++) {
        const uniqueTokenId = state.fractionalizedNFTs[i].depositedNFT.uniqueTokenID

        fractionalizedNFTsItems.push(<div key={i}>
            <SImg src={state.nftsImages[uniqueTokenId]} />
            <div>Available: {state.fractionalizedNFTs[i].availableFractions}/{state.fractionalizedNFTs[i].fractionsTotalSupply}</div>
        </div>)
    }

    // Prepare user bought fractions items
    const boughtFractionsItems = []

    const onClickBoughtFraction = (uniqueTokenId: any) => {
        if (state.selectedBoughtFractionsUniqueID === uniqueTokenId) {
            setState({...state, selectedBoughtFractionsUniqueID: '0'})
            return
        }

        setState({...state, selectedBoughtFractionsUniqueID: uniqueTokenId})
    }

    for (let i = 0; i < state.boughtFractions.length; i++) {
        const uniqueTokenId = state.boughtFractions[i].nft.depositedNFT.uniqueTokenID

        boughtFractionsItems.push(
        <div key={i}>
            {state.selectedBoughtFractionsUniqueID === uniqueTokenId
            ? <SSelectedImg src={state.nftsImages[uniqueTokenId]} onClick={() => { onClickBoughtFraction(uniqueTokenId) }} />
            : <SImg src={state.nftsImages[uniqueTokenId]} onClick={() => { onClickBoughtFraction(uniqueTokenId) }} />}
            <div>Bought: {state.boughtFractions[i].amount}/{state.boughtFractions[i].nft.fractionsTotalSupply}</div>
        </div>)
    }

    // Prepare NFTs for sale items
    const nftsForSaleItems = []

    const onClickNFTForSale = (uniqueTokenId: string, pricePerToken: string) => {
        if (state.selectedNFTForSaleUniqueTokenID === uniqueTokenId) {
            setState({...state, selectedNFTForSaleUniqueTokenID: '0', selectedNFTForSalePricePerToken: '0'})
            return
        }

        setState({...state, selectedNFTForSaleUniqueTokenID: uniqueTokenId, selectedNFTForSalePricePerToken: pricePerToken})
    }

    for (let i = 0; i < state.allNFTsForSale.length; i++) {
        const uniqueTokenId = state.allNFTsForSale[i].depositedNFT.uniqueTokenID
        const pricePerToken = state.allNFTsForSale[i].weiPricePerToken

        nftsForSaleItems.push(
            <div key={i}>
                {state.selectedNFTForSaleUniqueTokenID === uniqueTokenId
                ? <SSelectedImg src={state.nftsImages[uniqueTokenId]} onClick={() => { onClickNFTForSale(uniqueTokenId, pricePerToken) }} />
                : <SImg src={state.nftsImages[uniqueTokenId]} onClick={() => { onClickNFTForSale(uniqueTokenId, pricePerToken) }} />}
                <div>Bought: {state.allNFTsForSale[i].availableFractions}/{state.allNFTsForSale[i].fractionsTotalSupply}</div>
            </div>)
    }

    const currentlyInProgress = {}

    const depositNFT = async () => {
        const tokenID = state.selectedWalletTokenID

        if (tokenID === '0') {
            alert("Please select NFT from your wallet to deposit.")
            return
        }

        if (currentlyInProgress[tokenID] === true) {
            alert("Operation already in progress.")
            return
        }

        currentlyInProgress[tokenID] = true

        try {
            if (await simpleNFTContract.isApprovedForAll(props.account, fractionalizeNFTContract.address) === false) {
                const transaction = await simpleNFTContract.setApprovalForAll(fractionalizeNFTContract.address, true)
                const transactionReceipt = await transaction.wait()

                if (transactionReceipt.status !== 1) {
                    showNotification("Failed to deposit NFT.", NOTIFICATION_ERROR)
                    return
                }
            }

            const transaction = await fractionalizeNFTContract.deposit(simpleNFTContract.address, tokenID)
            const transactionReceipt = await transaction.wait()

            if (transactionReceipt.status === 1) {
                showNotification("Successfully deposited NFT.", NOTIFICATION_SUCCESS)
                forceUpdate()
            } else {
                showNotification("Failed to deposit NFT.", NOTIFICATION_ERROR)
            }
            
        } catch {
            showNotification("Failed to deposit NFT.", NOTIFICATION_ERROR)
        }

        currentlyInProgress[tokenID] = false
    }

    const showFractionalizePopup = async () => {
        if (state.selectedDepositedUniqueTokenID === '0') {
            alert("Please select deposited NFT to fractionalize.")
            return
        }

        setFractionalizePopup(true)
    }

    const showBuyFractionsPopup = async () => {
        if (state.selectedNFTForSaleUniqueTokenID === '0') {
            alert("Please select NFT to buy.")
            return
        }

        setBuyFractionsPopup(true)
    }

    const fractionalizeSell = async (totalSupply: string, tokenName: string, tokenSymbol: string, pricePerToken: string) => {
        setFractionalizePopup(false)

        try {
            const transaction = await fractionalizeNFTContract.fractionalizeSell(state.selectedDepositedUniqueTokenID, totalSupply, 
                tokenName, tokenSymbol, parseEther(pricePerToken))
            const transactionReceipt = await transaction.wait()

            if (transactionReceipt.status === 1) {
                showNotification("Successfully fractionalized.", NOTIFICATION_SUCCESS)
                forceUpdate()
            } else {
                showNotification("Failed to fractionlize.", NOTIFICATION_ERROR)
            }
        } catch {
            showNotification("Failed to fractionlize.", NOTIFICATION_ERROR)
        }
    }

    const buyFractions = async (amount: string) => {
        setBuyFractionsPopup(false)

        try {
            const transaction = await fractionalizeNFTContract.buy(state.selectedNFTForSaleUniqueTokenID, amount, {
                value: parseUnits(state.selectedNFTForSalePricePerToken, 'wei').mul(amount)
            })
            const transactionReceipt = await transaction.wait()

            if (transactionReceipt.status === 1) {
                showNotification("Successfully bought fractions.", NOTIFICATION_SUCCESS)
                forceUpdate()
            } else {
                showNotification("Failed to buy fractions.", NOTIFICATION_ERROR)
            }
        } catch {
            showNotification("Failed to buy fractions.", NOTIFICATION_ERROR)
        }
    }

    const buybackNFT = async () => {
        if (state.selectedBoughtFractionsUniqueID === '0') {
            alert("Please select bought fractions.")
            return
        }

        for (let i = 0; i < state.boughtFractions.length; i++) {
            if (state.boughtFractions[i].nft.depositedNFT.uniqueTokenID === state.selectedBoughtFractionsUniqueID) {

                try {
                    const fractionsContract = getContract(state.boughtFractions[i].nft.fractionsContract, ERC20.abi, props.library, props.account)
                    const allowanceAmount = await fractionsContract.allowance(props.account, fractionalizeNFTContract.address)
                    const fractionsTotalSupply = state.boughtFractions[i].nft.fractionsTotalSupply

                    if (fractionsTotalSupply >= allowanceAmount) {
                        const transaction = await fractionsContract.increaseAllowance(fractionalizeNFTContract.address, fractionsTotalSupply)
                        const transactionReceipt = await transaction.wait()

                        if (transactionReceipt.status !== 1) {
                            showNotification("Failed to buyback NFT", NOTIFICATION_ERROR)
                            continue
                        }
                    }

                    const transaction = await fractionalizeNFTContract.buyBackNFT(state.selectedBoughtFractionsUniqueID)
                    const transactionReceipt = await transaction.wait()

                    if (transactionReceipt.status === 1) {
                        showNotification("Successfully bought back NFT.", NOTIFICATION_SUCCESS)
                        forceUpdate()
                    } else {
                        showNotification("Failed to buyback NFT", NOTIFICATION_ERROR)
                    }

                } catch {
                    showNotification("Failed to buyback NFT.", NOTIFICATION_ERROR)
                }
            }
        }
    }

    const withdrawProfits = async() => {
        try {
            const transaction = await fractionalizeNFTContract.withdrawSalesProfit()
            const transactionReceipt = await transaction.wait()

            if (transactionReceipt.status === 1) {
                showNotification("Successfully withdraw sales profit.", NOTIFICATION_SUCCESS)
                forceUpdate()
            } else {
                showNotification("Failed to withdraw sales profit.", NOTIFICATION_ERROR)
            }
        } catch {
            showNotification("Failed to withdraw sales profit.", NOTIFICATION_ERROR)
        }
    }

    return (
        <div>
            <SBalanceDetails><span>Balance: {balance}</span><SButtonDelimeter /><span>Profit: {profit}</span></SBalanceDetails>
            <span>Your wallet NFTs:</span>
            <div>{userWalletNFTsItems}</div>
            <hr />
            <span>Your deposited NFTs:</span>
            <div>{depositedNFTsItems}</div>
            <hr />
            <span>Your fractionalized NFTs:</span>
            <div>{fractionalizedNFTsItems}</div>
            <hr />
            <span>Your bought fractions:</span>
            <div>{boughtFractionsItems}</div>
            <hr />
            <span>All fractionalized NFTs for sale:</span>
            <div>{nftsForSaleItems}</div>
            <hr />

            <Button onClick={depositNFT} children={React.createElement('span', null, 'Deposit')} />
            <SButtonDelimeter />
            <Button onClick={showFractionalizePopup} children={React.createElement('span', null, 'Fractionalize')} />
            <SButtonDelimeter />
            <Button onClick={showBuyFractionsPopup} children={React.createElement('span', null, 'Buy')} />
            <SButtonDelimeter />
            <Button onClick={buybackNFT} children={React.createElement('span', null, 'Buyback NFT')} />
            <SButtonDelimeter />
            <Button onClick={withdrawProfits} children={React.createElement('span', null, 'Withdraw Profit')} />

            <Popup open={fractionalizePopup} onClose={() => { setFractionalizePopup(false) }} modal>
                <FractionalizePopup fractionalizeSell={fractionalizeSell} close={() => { setFractionalizePopup(false) }} />
            </Popup>

            <Popup open={buyFractionsPopup} onClose={() => { setBuyFractionsPopup(false) }} modal>
                <BuyFractionsPopup buyFractions={buyFractions} close={() => { setBuyFractionsPopup(false) }} />
            </Popup>
        </div>
    )
}

export default FractionalizeNFT

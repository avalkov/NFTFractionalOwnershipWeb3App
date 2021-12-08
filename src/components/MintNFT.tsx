import React from 'react'
import styled from 'styled-components'
import Button from './Button'

import { getContract } from '../helpers/ethers';

import SimpleNFT from 'contracts/SimpleNFT.sol/SimpleNFT.json'
import { NOTIFICATION_SUCCESS, NOTIFICATION_ERROR, showNotification } from 'src/helpers/utilities';


const SLabel = styled.label`
    display: block;
    margin-top: 10px;
    margin-bottom: 10px;
`

const SUrlInput = styled.input`
    width: 600px;
    display: block;
`

const SButton = styled.div`
    margin-top: 10px;
`

interface IMintNFTProps {
    contractAddress: string,
    library: any,
    account: string,
}

const MintNFT = (props: IMintNFTProps) => {
    const [url, setUrl] = React.useState('')

    const contract = getContract(props.contractAddress, SimpleNFT.abi, props.library, props.account)

    const mint = async () => {
        if (!url) {
            alert("Url is required.")
            return
        }

        try {
            const transaction = await contract.mint(props.account, url)
            const transactionReceipt = await transaction.wait()

            if (transactionReceipt.status === 1) {
                showNotification("Successfully minted NFT.", NOTIFICATION_SUCCESS)
            } else {
                showNotification("Failed to mint NFT.", NOTIFICATION_ERROR)
            }
        } catch {
            showNotification("Failed to mint NFT.", NOTIFICATION_ERROR)
        }

        setUrl('')
    }

    return (
        <form>
            <div className='form-control'>
                <SLabel>Image url</SLabel>
                <SUrlInput type='text' placeholder='Image url' value={url} onChange={(e) => setUrl(e.target.value)} />
                <SButton>
                    <Button onClick={mint} children={React.createElement('span', null, 'Mint')} />
                </SButton>
            </div>
        </form>
    )
}

export default MintNFT

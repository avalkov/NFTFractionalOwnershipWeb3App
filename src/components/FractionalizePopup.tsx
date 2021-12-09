import React from 'react'
import Button from './Button'
import popupStyles from './PopupStyles'


const FractionalizePopup = (props: any) => {
    const [totalSupply, setTotalSupply] = React.useState(1)
    const [tokenName, setTokenName] = React.useState('')
    const [tokenSymbol, setTokenSymbol] = React.useState('')
    const [pricePerToken, setPericePerToken] = React.useState(0.01)

    const submit = () => {
        if (totalSupply < 1) {
            alert("Invalid total supply.")
            return
        }

        if (tokenName.length < 3) {
            alert("Token name too short.")
            return
        }

        if (tokenSymbol.length < 2) {
            alert("Token symbol too short.")
            return
        }

        if (pricePerToken <= 0.0) {
            alert("Invalid price per token.")
            return
        }

        props.fractionalizeSell(totalSupply, tokenName, tokenSymbol, pricePerToken.toString())
    }

    return (
        <popupStyles.SMainDiv>
            <popupStyles.SCloseButton className='close' onClick={props.close}>&times;</popupStyles.SCloseButton>

            <div>Total supply:</div>
            <input type='number' min='1' value={totalSupply} onChange={(e) => {
                    if (e.target.value.length > 0) {
                        setTotalSupply(parseInt(e.target.value, 10))
                    }
                }
            } />

            <div>Token name:</div>
            <input type='text' value={tokenName} onChange={(e) => {setTokenName(e.target.value)}} />

            <div>Token symbol:</div>
            <input type='text' maxLength={3} value={tokenSymbol} onChange={(e) => {setTokenSymbol(e.target.value)}} />

            <div>Price per token in ETH:</div>
            <input type='number' min='0' step='0.01' value={pricePerToken} onChange={(e) => {
                    if (e.target.value.length > 0) {
                        setPericePerToken(parseFloat(e.target.value))
                    }
                }
            } />
            
            <popupStyles.SButton>
                <Button onClick={submit} children={React.createElement('span', null, 'Submit')} />
            </popupStyles.SButton>
        </popupStyles.SMainDiv>
    )
}

export default FractionalizePopup
